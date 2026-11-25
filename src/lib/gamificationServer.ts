import type pg from 'pg';
import { pool,query } from './db';
import type { Word } from './types';
import { addCalendarDays,computeSkill,dateKey,hoursUntilNextLocalDay,levelFromXp,localDate,type AnswerSignal,type SkillProfile } from './gamification';
import { unlocks } from './unlocks';

export async function awardXp(client:pg.PoolClient,userId:string,eventType:string,sourceId:string,amount:number):Promise<number>{
  const result=await client.query<{award_xp:number}>('select award_xp($1,$2,$3,$4)',[userId,eventType,sourceId,amount]);
  return result.rows[0]?.award_xp??0;
}
export async function ensureGameRows(client:pg.PoolClient,userId:string){
  await client.query('insert into user_gamification(user_id) values($1) on conflict do nothing',[userId]);
  await client.query('insert into player_skill_profile(user_id) values($1) on conflict do nothing',[userId]);
}
export async function refreshSkill(client:pg.PoolClient,userId:string,timezone='UTC'):Promise<SkillProfile>{
  await ensureGameRows(client,userId);
  const result=await client.query<{question_type:string;difficulty:AnswerSignal['difficulty'];correct:boolean;response_ms:number;created_at:string}>(
    'select question_type,difficulty,correct,response_ms,created_at from meaningful_answers where user_id=$1 order by created_at desc limit 50',[userId]
  );
  const answers=result.rows.reverse().map((row)=>({questionType:row.question_type,difficulty:row.difficulty,correct:row.correct,responseMs:row.response_ms,createdAt:row.created_at}));
  const profile=computeSkill(answers,500);
  await client.query('update player_skill_profile set skill_rating=$1,avg_response_ms=$2,sample_size=$3,updated_at=now() where user_id=$4',[profile.rating,profile.avgResponseMs,profile.sampleSize,userId]);
  for(const [dimension,value] of Object.entries(profile.dimensions)){
    await client.query('insert into player_skill_dimensions(user_id,dimension,rating,sample_size) values($1,$2,$3,$4) on conflict(user_id,dimension) do update set rating=excluded.rating,sample_size=excluded.sample_size,updated_at=now()',[userId,dimension,value.rating,value.sampleSize]);
  }
  await client.query("insert into skill_history(user_id,rating) select $1,$2 where not exists(select 1 from skill_history where user_id=$1 and (recorded_at at time zone $3)::date=$4::date)",[userId,profile.rating,timezone,localDate(timezone)]);
  return profile;
}
async function unlockProgress(client:pg.PoolClient,userId:string,level:number){
  const counts=(await client.query<{completed_lessons:number;vocabulary_words:number}>(`select
    (select count(*)::int from lesson_sessions where user_id=$1 and status='completed') completed_lessons,
    (select count(*)::int from vocabulary_words where user_id=$1 and deleted_at is null) vocabulary_words`,[userId])).rows[0];
  const grants=(await client.query<{wordly:boolean;arena:boolean}>('select wordly,arena from game_unlock_grants where user_id=$1',[userId])).rows[0];
  return unlocks({completedLessons:counts.completed_lessons,vocabularyWords:counts.vocabulary_words,level},grants);
}
export async function userUnlocks(userId:string){
  const client=await pool().connect();
  try{const game=await client.query<{total_xp:number}>('select total_xp from user_gamification where user_id=$1',[userId]);return unlockProgress(client,userId,levelFromXp(game.rows[0]?.total_xp??0).level);}finally{client.release();}
}
export async function gameOverview(userId:string,timezone:string){
  const client=await pool().connect();
  try{
    await client.query('begin');await ensureGameRows(client,userId);
    const game=(await client.query<{total_xp:number;current_streak:number;longest_streak:number;last_lesson_date:string|null}>('select * from user_gamification where user_id=$1',[userId])).rows[0];
    const skill=await refreshSkill(client,userId,timezone);
    const today=localDate(timezone),yesterday=addCalendarDays(today,-1);
    const lastLessonDate=dateKey(game.last_lesson_date);
    const currentStreak=lastLessonDate===today||lastLessonDate===yesterday?game.current_streak:0;
    if(currentStreak!==game.current_streak)await client.query('update user_gamification set current_streak=0,updated_at=now() where user_id=$1',[userId]);
    const wordly=(await client.query<{completed:boolean;failed:boolean;attempts:number}>('select completed,failed,attempts from daily_wordly_assignments where user_id=$1 and local_date=$2',[userId,today])).rows[0]??null;
    const history=(await client.query<{rating:number;recorded_at:string}>('select rating,recorded_at from skill_history where user_id=$1 order by recorded_at desc limit 30',[userId])).rows.reverse();
    const unlock=await unlockProgress(client,userId,levelFromXp(game.total_xp).level);
    await client.query('commit');
    return {totalXp:game.total_xp,level:levelFromXp(game.total_xp),currentStreak,longestStreak:game.longest_streak,lastLessonDate,skill,skillHistory:history,wordly,unlocks:unlock};
  }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}
async function chooseWordlyWord(client:pg.PoolClient,userId:string,date:string):Promise<Word|null>{
  const sql='select w.* from vocabulary_words w left join review_state r on r.user_id=w.user_id and r.word_id=w.id where w.user_id=$1 and w.deleted_at is null and (w.definition_en is not null or w.translation_ru is not null or w.translation_kk is not null) and not exists(select 1 from daily_wordly_assignments d where d.user_id=w.user_id and d.word_id=w.id and d.local_date>($2::date-7)) order by case when char_length(trim(w.word))=5 then 0 else 1 end,case when r.next_review_at<=now() then 0 else 1 end,w.mastery_level asc,md5(w.id::text||$2) limit 1';
  const result=await client.query<Word>(sql,[userId,date]);
  if(result.rows[0])return result.rows[0];
  const fallback=await client.query<Word>('select * from vocabulary_words where user_id=$1 and deleted_at is null and (definition_en is not null or translation_ru is not null or translation_kk is not null) order by mastery_level asc,md5(id::text||$2) limit 1',[userId,date]);
  return fallback.rows[0]??null;
}
export async function ensureWordly(client:pg.PoolClient,userId:string,timezone:string,date=localDate(timezone)){
  if(!(await userUnlocks(userId)).wordly)return null;
  const existing=await client.query('select * from daily_wordly_assignments where user_id=$1 and local_date=$2',[userId,date]);
  if(existing.rows[0])return existing.rows[0];
  const word=await chooseWordlyWord(client,userId,date);if(!word)return null;
  const result=await client.query('insert into daily_wordly_assignments(user_id,local_date,timezone,word_id) values($1,$2,$3,$4) on conflict(user_id,local_date) do update set local_date=excluded.local_date returning *',[userId,date,timezone,word.id]);
  return result.rows[0];
}
function hideTarget(example:string,target:string):string{
  const escaped=target.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  return example.replace(new RegExp('\\b'+escaped+'\\b','gi'),'______');
}
export function publicWordly(assignment:Record<string,unknown>,word:Word){
  const attempts=Number(assignment.attempts),done=Boolean(assignment.completed)||Boolean(assignment.failed);
  const clues:Array<{label:string;value:string}>=[];
  if(word.definition_en)clues.push({label:'Definition',value:word.definition_en});
  if(attempts>=1&&word.example_sentence)clues.push({label:'Example',value:hideTarget(word.example_sentence,word.word)});
  if(attempts>=2&&word.translation_ru)clues.push({label:'Russian',value:word.translation_ru});
  if(attempts>=3&&word.translation_kk)clues.push({label:'Kazakh',value:word.translation_kk});
  if(attempts>=4)clues.push({label:'First letter',value:word.word.charAt(0).toUpperCase()});
  const assignmentDate=typeof assignment.local_date==='string'||assignment.local_date instanceof Date?assignment.local_date:null;
  return {id:assignment.id,localDate:dateKey(assignmentDate),length:Array.from(word.word).length,attempts,maxAttempts:6,completed:assignment.completed,failed:assignment.failed,xpAwarded:assignment.xp_awarded,clues,...(done?{answer:{word:word.word,definition:word.definition_en,example:word.example_sentence}}:{})};
}
export async function prepareUpcomingWordly(now=new Date()){
  const started=Date.now(),client=await pool().connect();let created=0,skipped=0,errors=0;
  try{
    const users=await client.query<{id:string;timezone:string}>("select id,timezone from users where is_demo=false and (created_at>now()-interval '120 days' or exists(select 1 from sessions where sessions.user_id=users.id and expires_at>now()))");
    for(const user of users.rows){
      try{
        if(hoursUntilNextLocalDay(user.timezone,now)>6){skipped++;continue;}
        const tomorrow=addCalendarDays(localDate(user.timezone,now),1);
        await client.query('begin');const before=await client.query('select 1 from daily_wordly_assignments where user_id=$1 and local_date=$2',[user.id,tomorrow]);
        const result=await ensureWordly(client,user.id,user.timezone,tomorrow);await client.query('commit');
        if(!before.rowCount&&result)created++;else skipped++;
      }catch{await client.query('rollback');errors++;}
    }
    await client.query('insert into wordly_scheduler_runs(users_checked,assignments_created,skipped,errors,duration_ms) values($1,$2,$3,$4,$5)',[users.rowCount,created,skipped,errors,Date.now()-started]);
    return {usersChecked:users.rowCount,assignmentsCreated:created,skipped,errors,durationMs:Date.now()-started};
  }finally{client.release();}
}
export async function timezoneForUser(userId:string):Promise<string>{
  return (await query<{timezone:string}>('select timezone from users where id=$1',[userId]))[0]?.timezone??'UTC';
}
