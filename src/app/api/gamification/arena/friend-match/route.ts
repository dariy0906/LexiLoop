import { authorized,failure,isResponse } from '@/lib/api';
import { pool } from '@/lib/db';
import { userUnlocks } from '@/lib/gamificationServer';
import { buildQuestions } from '@/lib/gameQuestions';
import type { Word } from '@/lib/types';
import type { PoolClient } from 'pg';

type Row={status:'waiting'|'matched';display_name:string|null;match_id:string|null};
async function responseFor(client:PoolClient,userId:string){const row=(await client.query<Row>('select q.status,u.display_name,q.match_id from arena_matchmaking_queue q left join users u on u.id=q.opponent_user_id where q.user_id=$1',[userId])).rows[0];return row?.status==='matched'&&row.match_id?{status:'matched' as const,opponentName:row.display_name||'Player',matchId:row.match_id}:{status:'waiting' as const};}
export async function POST(){
  const user=await authorized();if(isResponse(user))return user;
  if(!(await userUnlocks(user.id)).arena)return failure(new Error('Battle Arena is locked.'),403);
  const client=await pool().connect();
  try{await client.query('begin');await client.query("delete from arena_matchmaking_queue where status='waiting' and joined_at<now()-interval '10 minutes'");
    const own=(await client.query<Row>('select q.status,u.display_name,q.match_id from arena_matchmaking_queue q left join users u on u.id=q.opponent_user_id where q.user_id=$1 for update of q',[user.id])).rows[0];
    if(own?.status==='matched'&&own.match_id){await client.query('commit');return Response.json({status:'matched',opponentName:own.display_name||'Player',matchId:own.match_id});}
    if(own?.status==='matched')await client.query("update arena_matchmaking_queue set status='waiting',opponent_user_id=null,match_id=null,joined_at=now() where user_id=",[user.id]);
    if(!own)await client.query("insert into arena_matchmaking_queue(user_id,status) values($1,'waiting')",[user.id]);
    const opponent=(await client.query<{user_id:string;display_name:string|null}>("select q.user_id,u.display_name from arena_matchmaking_queue q join users u on u.id=q.user_id where q.status='waiting' and q.user_id<>$1 order by q.joined_at for update skip locked limit 1",[user.id])).rows[0];
    if(!opponent){await client.query('commit');return Response.json({status:'waiting'});}
    const words=(await client.query<Word>(`select w.* from vocabulary_words w left join review_state r on r.user_id=w.user_id and r.word_id=w.id where w.user_id=$1 and w.deleted_at is null and (w.translation_ru is not null or w.translation_kk is not null or w.definition_en is not null) order by case when r.next_review_at<=now() then 0 else 1 end,w.mastery_level asc,w.updated_at desc limit 40`,[user.id])).rows;
    const questions=buildQuestions(words,3,['translation','definition','sentence_completion']);if(questions.length!==3){await client.query('rollback');return failure(new Error('Add at least three useful vocabulary words before entering the Arena.'),409);}
    const names=(await client.query<{id:string;display_name:string|null}>('select id,display_name from users where id in ($1,$2)',[opponent.user_id,user.id])).rows;const name=(id:string)=>names.find((row)=>row.id===id)?.display_name||'Player';
    const match=(await client.query<{id:string}>('insert into arena_pvp_matches(player_one_id,player_two_id,player_one_name,player_two_name) values($1,$2,$3,$4) returning id',[opponent.user_id,user.id,name(opponent.user_id),name(user.id)])).rows[0];
    for(const [index,question] of questions.entries())await client.query('insert into arena_pvp_rounds(match_id,round_number,question_type,difficulty,prompt,options,accepted_answers) values($1,$2,$3,$4,$5,$6,$7)',[match.id,index+1,question.type,question.difficulty,question.prompt,JSON.stringify(question.options),JSON.stringify(question.acceptedAnswers)]);
    await client.query("update arena_matchmaking_queue set status='matched',opponent_user_id=$2,match_id=$3,matched_at=now() where user_id=$1",[user.id,opponent.user_id,match.id]);
    await client.query("update arena_matchmaking_queue set status='matched',opponent_user_id=$2,match_id=$3,matched_at=now() where user_id=$1",[opponent.user_id,user.id,match.id]);
    await client.query('commit');return Response.json({status:'matched',opponentName:opponent.display_name||'Player',matchId:match.id});
  }catch(error){await client.query('rollback');return failure(error,500);}finally{client.release();}
}
export async function GET(){const user=await authorized();if(isResponse(user))return user;const client=await pool().connect();try{return Response.json(await responseFor(client,user.id));}finally{client.release();}}
export async function DELETE(){const user=await authorized();if(isResponse(user))return user;await pool().query("delete from arena_matchmaking_queue where user_id=$1 and status='waiting'",[user.id]);return Response.json({ok:true});}
