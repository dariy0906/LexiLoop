import { NextResponse } from 'next/server';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool } from '@/lib/db';
import { wordSchema } from '@/lib/parsers';
export async function POST(request:Request) {
  const user=await authorized(); if (isResponse(user)) return user;
  const client=await pool().connect();
  try {
    const v=wordSchema.parse(await request.json());
    await client.query('begin');
    const {rows}=await client.query<{id:string}>('insert into vocabulary_words(user_id,word,phonetic,definition_en,translation_ru,translation_kk,example_sentence,notes,category_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',[user.id,v.word,v.phonetic,v.definition_en,v.translation_ru,v.translation_kk,v.example_sentence,v.notes,v.category_id]);
    await client.query('insert into review_state(id,user_id,word_id) values($1,$2,$3)',[rows[0].id,user.id,rows[0].id]);
    await client.query('commit'); return NextResponse.json({id:rows[0].id},{status:201});
  } catch(error) { await client.query('rollback'); return failure(error); } finally { client.release(); }
}
