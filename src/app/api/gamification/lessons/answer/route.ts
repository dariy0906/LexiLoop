import type pg from 'pg';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { isAccepted } from '@/lib/gameQuestions';
import { XP_RULES,updateStreak } from '@/lib/gamification';
import { awardXp,ensureGameRows,refreshSkill } from '@/lib/gamificationServer';
const schema=z.object({sessionId:z.uuid(),position:z.number().int().min(1).max(10),answer:z.string().trim().max(1000),responseMs:z.number().finite().min(0).max(120000)});
type Question={id:string;question_type:string;difficulty:'A1'|'A2'|'B1'|'B2'|'C1'|'C2';accepted_answers:string[];correct:boolean|null};
type Session={id:string;status:string;local_date:string;question_count:number};
async function lessonProgress(client:pg.PoolClient,sessionId:string){
  return (await client.query<{answered:number;correct_count:number}>('select count(*) filter(where correct is not null)::int answered,count(*) filter(where correct=true)::int correct_count from lesson_questions where session_id=$1',[sessionId])).rows[0];
}
async function completedResult(client:pg.PoolClient,userId:string,sessionId:string,timezone:string){
  await ensureGameRows(client,userId);
  const session=(await client.query<{correct_count:number;question_count:number;xp_awarded:number}>('select correct_count,question_count,xp_awarded from lesson_sessions where id=$1 and user_id=$2',[sessionId,userId])).rows[0];
  const game=(await client.query<{current_streak:number;longest_streak:number}>('select current_streak,longest_streak from user_gamification where user_id=$1',[userId])).rows[0];
  const skill=await refreshSkill(client,userId,timezone);
  const missed=(await client.query<{word:string}>('select distinct w.word from lesson_questions q join vocabulary_words w on w.id=q.word_id and w.user_id=q.user_id where q.session_id=$1 and q.correct=false',[sessionId])).rows.map((row)=>row.word);
  return {correct:session.correct_count,total:session.question_count,xpEarned:session.xp_awarded,streak:{current:game.current_streak,longest:game.longest_streak},skill,missed};
}
export async function POST(request:Request){
  const user=await authorized();if(isResponse(user))return user;const client=await pool().connect();
  try{
    const value=schema.parse(await request.json()),responseMs=Math.max(0,Math.round(value.responseMs));await client.query('begin');
    const session=(await client.query<Session>('select id,status,local_date,question_count from lesson_sessions where id=$1 and user_id=$2 for update',[value.sessionId,user.id])).rows[0];
    if(!session){await client.query('rollback');return failure(new Error('Lesson not found.'),404);}
    const question=(await client.query<Question>('select id,question_type,difficulty,accepted_answers,correct from lesson_questions where session_id=$1 and user_id=$2 and position=$3 for update',[session.id,user.id,value.position])).rows[0];
    if(!question){await client.query('rollback');return failure(new Error('Question not found.'),404);}
    if(question.correct!==null){
      const progress=await lessonProgress(client,session.id);
      if(session.status==='completed'){
        const game=await completedResult(client,user.id,session.id,user.timezone);
        await client.query('commit');
        return Response.json({duplicate:true,correct:question.correct,acceptedAnswer:question.accepted_answers[0],answered:progress.answered,total:session.question_count,completed:true,result:game});
      }
      await client.query('commit');
      return Response.json({duplicate:true,correct:question.correct,acceptedAnswer:question.accepted_answers[0],answered:progress.answered,total:session.question_count,completed:false,result:null});
    }
    if(session.status!=='active'){await client.query('rollback');return failure(new Error('Lesson is already complete.'),409);}
    const correct=isAccepted(value.answer,question.accepted_answers);
    await client.query('update lesson_questions set submitted_answer=$1,correct=$2,response_ms=$3,answered_at=now() where id=$4',[value.answer,correct,responseMs,question.id]);
    await client.query('insert into meaningful_answers(user_id,source_type,source_id,question_type,difficulty,correct,response_ms) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing',[user.id,'lesson',question.id,question.question_type,question.difficulty,correct,responseMs]);
    const progress=await lessonProgress(client,session.id);
    let completed=false,game=null;
    if(progress.answered===session.question_count){
      const amount=XP_RULES.lessonComplete+progress.correct_count*XP_RULES.lessonCorrect;
      const xpEarned=await awardXp(client,user.id,'quick_lesson',session.id,amount);
      await ensureGameRows(client,user.id);
      const current=(await client.query<{current_streak:number;longest_streak:number;last_lesson_date:string|null}>('select current_streak,longest_streak,last_lesson_date from user_gamification where user_id=$1 for update',[user.id])).rows[0];
      const streak=updateStreak(current.current_streak,current.longest_streak,current.last_lesson_date,session.local_date);
      await client.query('update user_gamification set current_streak=$1,longest_streak=$2,last_lesson_date=$3,updated_at=now() where user_id=$4',[streak.current,streak.longest,streak.lastDate,user.id]);
      await client.query("update lesson_sessions set status='completed',correct_count=$1,xp_awarded=xp_awarded+$2,completed_at=now() where id=$3",[progress.correct_count,xpEarned,session.id]);
      game=await completedResult(client,user.id,session.id,user.timezone);completed=true;
    }
    await client.query('commit');
    return Response.json({correct,acceptedAnswer:question.accepted_answers[0],answered:progress.answered,total:session.question_count,completed,result:game});
  }catch(error){await client.query('rollback');return failure(error);}finally{client.release();}
}
