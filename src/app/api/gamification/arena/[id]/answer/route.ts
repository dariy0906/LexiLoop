import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { isAccepted } from '@/lib/gameQuestions';
import { roundWinner,SPECTATORS,XP_RULES,type Difficulty } from '@/lib/gamification';
import { awardXp,refreshSkill } from '@/lib/gamificationServer';
const schema=z.object({round:z.number().int().min(1).max(3),answer:z.string().trim().max(1000),responseMs:z.number().finite().max(120000)});
type Round={id:string;round_number:number;question_type:string;difficulty:Difficulty;prompt:string;options:string[];accepted_answers:string[];player_correct:boolean|null;bot_correct:boolean;bot_answer:string;bot_response_ms:number;winner:'player'|'opponent'|'draw'|null;spectators_awarded:number};
export async function POST(request:Request,context:RouteContext<'/api/gamification/arena/[id]/answer'>){
  const user=await authorized();if(isResponse(user))return user;const {id}=await context.params,client=await pool().connect();
  try{
    const parsed=schema.parse(await request.json()),value={...parsed,responseMs:Math.max(0,Math.round(parsed.responseMs))};await client.query('begin');
    const match=(await client.query<{id:string;status:string;player_spectators:number;opponent_spectators:number;winner:'player'|'opponent'|'draw'|null}>('select id,status,player_spectators,opponent_spectators,winner from arena_matches where id=$1 and user_id=$2 for update',[id,user.id])).rows[0];
    if(!match){await client.query('rollback');return failure(new Error('Battle not found.'),404);}
    const round=(await client.query<Round>('select * from arena_rounds where match_id=$1 and user_id=$2 and round_number=$3 for update',[id,user.id,value.round])).rows[0];
    if(!round){await client.query('rollback');return failure(new Error('Round not found.'),404);}
    if(round.player_correct!==null){
      const next=(await client.query<Round>('select * from arena_rounds where match_id=$1 and user_id=$2 and round_number=$3',[id,user.id,round.round_number+1])).rows[0];
      const score={player:match.player_spectators,opponent:match.opponent_spectators};
      if(match.status==='completed'){
        const roundXp=(round.player_correct?XP_RULES.arenaRoundCorrect+XP_RULES.arenaDifficultyBonus[round.difficulty]:0)+(round.winner==='player'?XP_RULES.arenaRoundWin:0);
        const matchXp=match.winner==='player'?XP_RULES.arenaMatchWin:0;
        await client.query('commit');
        return Response.json({duplicate:true,round:publicResult(round),score,completed:true,result:{winner:match.winner,xpEarned:roundXp+matchXp},next:null});
      }
      await client.query('commit');
      return Response.json({duplicate:true,round:publicResult(round),score,completed:false,result:null,next:next?publicQuestion(next):null});
    }
    if(match.status!=='active'){await client.query('rollback');return failure(new Error('Battle is already complete.'),409);}
    if(value.round>1){
      const previous=(await client.query<{player_correct:boolean|null}>('select player_correct from arena_rounds where match_id=$1 and user_id=$2 and round_number=$3',[id,user.id,value.round-1])).rows[0];
      if(!previous||previous.player_correct===null){await client.query('rollback');return failure(new Error('Answer the rounds in order.'),409);}
    }
    const playerCorrect=isAccepted(value.answer,round.accepted_answers),winner=roundWinner(playerCorrect,round.bot_correct,value.responseMs,round.bot_response_ms);
    const spectators=winner==='draw'?0:SPECTATORS[round.difficulty];
    await client.query('update arena_rounds set player_answer=$1,player_correct=$2,player_response_ms=$3,winner=$4,spectators_awarded=$5,answered_at=now() where id=$6',[value.answer,playerCorrect,value.responseMs,winner,spectators,round.id]);
    await client.query('insert into meaningful_answers(user_id,source_type,source_id,question_type,difficulty,correct,response_ms) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing',[user.id,'arena',round.id,round.question_type,round.difficulty,playerCorrect,value.responseMs]);
    const roundXp=(playerCorrect?XP_RULES.arenaRoundCorrect+XP_RULES.arenaDifficultyBonus[round.difficulty]:0)+(winner==='player'?XP_RULES.arenaRoundWin:0);
    const awardedRound=await awardXp(client,user.id,'arena_round',round.id,roundXp);
    const playerTotal=match.player_spectators+(winner==='player'?spectators:0),botTotal=match.opponent_spectators+(winner==='opponent'?spectators:0);
    const completed=value.round===3;let matchWinner:null|'player'|'opponent'|'draw'=null,matchXp=0;
    if(completed){
      matchWinner=playerTotal===botTotal?'draw':playerTotal>botTotal?'player':'opponent';
      if(matchWinner==='player')matchXp=await awardXp(client,user.id,'arena_match',id,XP_RULES.arenaMatchWin);
      await client.query("update arena_matches set player_spectators=$1,opponent_spectators=$2,winner=$3,status='completed',xp_awarded=xp_awarded+$4,completed_at=now() where id=$5",[playerTotal,botTotal,matchWinner,awardedRound+matchXp,id]);
      await refreshSkill(client,user.id,user.timezone);
    }else await client.query('update arena_matches set player_spectators=$1,opponent_spectators=$2,xp_awarded=xp_awarded+$3 where id=$4',[playerTotal,botTotal,awardedRound,id]);
    const next=completed?null:(await client.query<Round>('select * from arena_rounds where match_id=$1 and user_id=$2 and round_number=$3',[id,user.id,value.round+1])).rows[0];
    await client.query('commit');
    return Response.json({round:{number:value.round,playerCorrect,botCorrect:round.bot_correct,botAnswer:round.bot_answer,botResponseMs:round.bot_response_ms,winner,spectators,acceptedAnswer:round.accepted_answers[0],xpEarned:awardedRound},score:{player:playerTotal,opponent:botTotal},completed,result:completed?{winner:matchWinner,xpEarned:awardedRound+matchXp}:null,next:next?publicQuestion(next):null});
  }catch(error){await client.query('rollback');return failure(error);}finally{client.release();}
}
function publicQuestion(round:Round){return {number:round.round_number,type:round.question_type,difficulty:round.difficulty,prompt:round.prompt,options:round.options};}
function publicResult(round:Round){return {number:round.round_number,playerCorrect:round.player_correct,botCorrect:round.bot_correct,botAnswer:round.bot_answer,botResponseMs:round.bot_response_ms,winner:round.winner,spectators:round.spectators_awarded,acceptedAnswer:round.accepted_answers[0]};}
