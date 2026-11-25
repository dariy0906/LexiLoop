import { connection } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { awardXp,ensureWordly,publicWordly,timezoneForUser,userUnlocks } from '@/lib/gamificationServer';
import { localDate,XP_RULES } from '@/lib/gamification';
import { normalizeAnswer } from '@/lib/gameQuestions';
import type { Word } from '@/lib/types';
const schema=z.object({guess:z.string().trim().min(1).max(120),requestId:z.uuid().optional()});
async function loadWordly(userId:string){
  const timezone=await timezoneForUser(userId),client=await pool().connect();
  try{
    await client.query('begin');
    const assignment=await ensureWordly(client,userId,timezone,localDate(timezone));
    if(!assignment){await client.query('commit');return null;}
    const word=(await client.query<Word>('select * from vocabulary_words where id=$1 and user_id=$2',[assignment.word_id,userId])).rows[0];
    await client.query('commit');return publicWordly(assignment,word);
  }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}
export async function GET(){
  await connection();const user=await authorized();if(isResponse(user))return user;
  try{if(!(await userUnlocks(user.id)).wordly)return failure(new Error('Complete 5 Quick Lessons and save 10 words to unlock Daily Wordly.'),403);const wordly=await loadWordly(user.id);return wordly?Response.json({wordly}):failure(new Error('Add a word with a meaning before playing Wordly.'),409);}catch(error){return failure(error,500);}
}
export async function POST(request:Request){
  const user=await authorized();if(isResponse(user))return user;
  if(!(await userUnlocks(user.id)).wordly)return failure(new Error('Complete 5 Quick Lessons and save 10 words to unlock Daily Wordly.'),403);
  const client=await pool().connect();
  try{
    const {guess,requestId}=schema.parse(await request.json()),timezone=await timezoneForUser(user.id),today=localDate(timezone);
    await client.query('begin');
    let assignment=await ensureWordly(client,user.id,timezone,today);
    if(!assignment){await client.query('rollback');return failure(new Error('Add a word with a meaning before playing Wordly.'),409);}
    assignment=(await client.query('select * from daily_wordly_assignments where id=$1 and user_id=$2 for update',[assignment.id,user.id])).rows[0];
    const word=(await client.query<Word>('select * from vocabulary_words where id=$1 and user_id=$2',[assignment.word_id,user.id])).rows[0];
    if(requestId&&assignment.last_request_id===requestId){await client.query('commit');return Response.json({wordly:publicWordly(assignment,word),correct:assignment.completed,xpEarned:0,duplicate:true});}
    if(assignment.completed||assignment.failed){await client.query('commit');return Response.json({wordly:publicWordly(assignment,word),correct:assignment.completed,xpEarned:0});}
    const attempts=assignment.attempts+1,correct=normalizeAnswer(guess)===normalizeAnswer(word.word),failed=!correct&&attempts>=6;
    let xpEarned=0;
    if(correct)xpEarned=await awardXp(client,user.id,'daily_wordly',assignment.id,XP_RULES.wordlyByAttempt[attempts-1]??0);
    assignment=(await client.query('update daily_wordly_assignments set attempts=$1,completed=$2,failed=$3,xp_awarded=xp_awarded+$4,completed_at=case when $2 or $3 then now() else null end,last_request_id=$6 where id=$5 returning *',[attempts,correct,failed,xpEarned,assignment.id,requestId??null])).rows[0];
    await client.query('commit');return Response.json({wordly:publicWordly(assignment,word),correct,xpEarned});
  }catch(error){await client.query('rollback');return failure(error);}finally{client.release();}
}
