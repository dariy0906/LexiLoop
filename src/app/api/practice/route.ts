import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { query } from '@/lib/db';
import { checkPracticeAnswer } from '@/lib/practice';
import type { Word } from '@/lib/types';
const schema=z.object({wordId:z.uuid(),mode:z.enum(['quiz','sentence','writing']),answer:z.string().trim().max(2000)});
export async function POST(request:Request) {
  const user=await authorized(); if(isResponse(user)) return user;
  try {
    const v=schema.parse(await request.json());
    const word=(await query<Word>('select * from vocabulary_words where id=$1 and user_id=$2 and deleted_at is null',[v.wordId,user.id]))[0];
    if(!word) return failure(new Error('Word not found.'),404);
    const correct=checkPracticeAnswer(v.mode,v.answer,word);
    await query('insert into practice_attempts(user_id,word_id,mode,answer,correct) values($1,$2,$3,$4,$5)',[user.id,word.id,v.mode,v.answer,correct]);
    return NextResponse.json({ok:true,correct},{status:201});
  } catch(error) { return failure(error); }
}
