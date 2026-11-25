import { authorized,isResponse,failure } from '@/lib/api';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { buildQuestions } from '@/lib/gameQuestions';
import { botOutcome,createBot } from '@/lib/gamification';
import { refreshSkill,userUnlocks } from '@/lib/gamificationServer';
import type { Word } from '@/lib/types';
export async function POST(request:Request){
  const user=await authorized();if(isResponse(user))return user;
  if(!(await userUnlocks(user.id)).arena)return failure(new Error('Reach level 20 and save 25 words to unlock Battle Arena.'),403);
  const client=await pool().connect();
  try{
    const {mode}=z.object({mode:z.enum(['friend','player']).default('player')}).parse(await request.json().catch(()=>({})));
    await client.query('begin');
    const words=(await client.query<Word>(`select w.* from vocabulary_words w left join review_state r on r.user_id=w.user_id and r.word_id=w.id
      where w.user_id=$1 and w.deleted_at is null and (w.translation_ru is not null or w.translation_kk is not null or w.definition_en is not null)
      order by case when r.next_review_at<=now() then 0 else 1 end,w.mastery_level asc,w.updated_at desc limit 40`,[user.id])).rows;
    const questions=buildQuestions(words,3,['translation','definition','sentence_completion']);
    if(questions.length!==3||new Set(questions.map((question)=>question.wordId)).size<3){await client.query('rollback');return failure(new Error('Add at least three useful vocabulary words before entering the Arena.'),409);}
    await client.query("update arena_matches set status='cancelled',completed_at=now() where user_id=$1 and status='active'",[user.id]);
    const profile=await refreshSkill(client,user.id,user.timezone),bot=createBot(profile);
    if(mode==='friend')bot.name='Buddy';
    const match=(await client.query<{id:string}>('insert into arena_matches(user_id,opponent_name,player_skill_snapshot,opponent_skill_snapshot) values($1,$2,$3,$4) returning id',[user.id,bot.name,JSON.stringify(profile),JSON.stringify(bot)])).rows[0];
    for(const [index,question] of questions.entries()){
      const outcome=botOutcome(bot,question.difficulty,question.type);
      await client.query('insert into arena_rounds(match_id,user_id,round_number,word_id,question_type,difficulty,prompt,options,accepted_answers,bot_answer,bot_correct,bot_response_ms) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[match.id,user.id,index+1,question.wordId,question.type,question.difficulty,question.prompt,JSON.stringify(question.options),JSON.stringify(question.acceptedAnswers),outcome.correct?question.acceptedAnswers[0]:'No answer',outcome.correct,outcome.responseMs]);
    }
    await client.query('commit');
    return Response.json({matchId:match.id,opponent:{name:bot.name,type:'BOT',level:bot.level,rating:bot.rating},calibrating:profile.calibrating,round:{number:1,type:questions[0].type,difficulty:questions[0].difficulty,prompt:questions[0].prompt,options:questions[0].options}},{status:201});
  }catch(error){await client.query('rollback');return failure(error);}finally{client.release();}
}
