import { NextResponse, connection } from 'next/server';
import { authorized, isResponse, failure } from '@/lib/api';
import { query } from '@/lib/db';
export async function GET() {
  await connection();
  try {
    const user=await authorized(); if (isResponse(user)) return user;
    const [words,categories,states,events,practice,speaking]=await Promise.all([
      query('select * from vocabulary_words where user_id=$1 and deleted_at is null order by updated_at desc',[user.id]),
      query('select * from categories where user_id=$1 and deleted_at is null order by name',[user.id]),
      query('select * from review_state where user_id=$1',[user.id]),
      query('select * from review_events where user_id=$1 order by reviewed_at desc limit 3000',[user.id]),
      query('select * from practice_attempts where user_id=$1 order by created_at desc limit 1000',[user.id]),
      query('select id,word_id,prompt_text,transcript_text,feedback_text,created_at from speaking_attempts where user_id=$1 order by created_at desc limit 100',[user.id]),
    ]);
    return NextResponse.json({user,words,categories,states,events,practice,speaking});
  } catch(error) { return failure(error,500); }
}
