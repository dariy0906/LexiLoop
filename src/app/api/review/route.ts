import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { scheduleReview,deriveMasteryLevel } from '@/lib/scheduler';
import type { ReviewState } from '@/lib/types';
const schema=z.object({wordId:z.uuid(),rating:z.enum(['Again','Hard','Good','Easy']),eventId:z.uuid()});
export async function POST(request:Request) {
  const user=await authorized(); if(isResponse(user)) return user;
  const client=await pool().connect();
  try {
    const {wordId,rating,eventId}=schema.parse(await request.json()); await client.query('begin');
    const {rows}=await client.query<ReviewState>('select s.* from review_state s join vocabulary_words w on w.id=s.word_id and w.user_id=s.user_id where s.word_id=$1 and s.user_id=$2 and w.deleted_at is null for update of s',[wordId,user.id]);
    if(!rows[0]) { await client.query('rollback'); return failure(new Error('Word not found.'),404); }
    const existing=await client.query('select id from review_events where id=$1 and user_id=$2',[eventId,user.id]);
    if(existing.rowCount) { await client.query('commit'); return NextResponse.json({ok:true,duplicate:true}); }
    const before=rows[0]; const now=new Date().toISOString(); const after=scheduleReview(before,rating,now);
    await client.query('update review_state set interval_days=$1,ease_factor=$2,repetitions=$3,last_reviewed_at=$4,next_review_at=$5,updated_at=$6 where word_id=$7 and user_id=$8',[after.interval_days,after.ease_factor,after.repetitions,after.last_reviewed_at,after.next_review_at,after.updated_at,wordId,user.id]);
    await client.query('update vocabulary_words set mastery_level=$1,updated_at=$2 where id=$3 and user_id=$4',[deriveMasteryLevel(after.repetitions,after.interval_days),now,wordId,user.id]);
    await client.query('insert into review_events(id,user_id,word_id,rating,reviewed_at,previous_interval_days,new_interval_days) values($1,$2,$3,$4,$5,$6,$7)',[eventId,user.id,wordId,rating,now,before.interval_days,after.interval_days]);
    await client.query('commit'); return NextResponse.json({ok:true,nextReviewAt:after.next_review_at});
  } catch(error) { await client.query('rollback'); return failure(error); } finally { client.release(); }
}
