import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { buildQuestions } from '@/lib/gameQuestions';
import { localDate } from '@/lib/gamification';
import { timezoneForUser } from '@/lib/gamificationServer';
import type { Word } from '@/lib/types';
const schema=z.object({count:z.number().int().min(5).max(10).default(8)});
export async function POST(request:Request){
  const user=await authorized();if(isResponse(user))return user;const client=await pool().connect();
  try{
    const {count}=schema.parse(await request.json()),timezone=await timezoneForUser(user.id);
    const words=(await client.query<Word>(`select w.* from vocabulary_words w left join review_state r on r.user_id=w.user_id and r.word_id=w.id
      where w.user_id=$1 and w.deleted_at is null and (w.translation_ru is not null or w.translation_kk is not null or w.definition_en is not null)
      order by case when r.next_review_at<=now() then 0 else 1 end,
      case when exists(select 1 from review_events e where e.user_id=w.user_id and e.word_id=w.id and e.rating in ('Again','Hard') and e.reviewed_at>now()-interval '14 days') then 0 else 1 end,
      case when exists(select 1 from practice_attempts p where p.user_id=w.user_id and p.word_id=w.id and p.correct=false and p.created_at>now()-interval '30 days') then 0 else 1 end,
      w.created_at desc limit 40`,[user.id])).rows;
    const questions=buildQuestions(words,count,['translation','definition','sentence_completion','reverse_translation','recall','context']);
    const distinctWords=new Set(questions.map((question)=>question.wordId)).size;
    if(questions.length<count||distinctWords<Math.min(count,3))return failure(new Error('Add at least three useful words with meanings to start a Quick Lesson.'),409);
    await client.query('begin');
    await client.query("update lesson_sessions set status='cancelled' where user_id=$1 and status='active'",[user.id]);
    const session=(await client.query<{id:string}>('insert into lesson_sessions(user_id,local_date,timezone,question_count) values($1,$2,$3,$4) returning id',[user.id,localDate(timezone),timezone,questions.length])).rows[0];
    for(const [index,question] of questions.entries())await client.query(
      'insert into lesson_questions(session_id,user_id,position,word_id,question_type,difficulty,prompt,options,accepted_answers) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [session.id,user.id,index+1,question.wordId,question.type,question.difficulty,question.prompt,JSON.stringify(question.options),JSON.stringify(question.acceptedAnswers)]
    );
    await client.query('commit');
    return Response.json({sessionId:session.id,questions:questions.map((question,index)=>({position:index+1,type:question.type,difficulty:question.difficulty,prompt:question.prompt,options:question.options}))},{status:201});
  }catch(error){await client.query('rollback');return failure(error);}finally{client.release();}
}
