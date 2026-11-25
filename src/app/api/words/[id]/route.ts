import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { query } from '@/lib/db';
import { wordSchema } from '@/lib/parsers';
type Params={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Params) {
  const user=await authorized(); if (isResponse(user)) return user;
  try {
    const {id}=await params; z.uuid().parse(id);
    const body=await request.json();
    if (Object.keys(body).length===1 && typeof body.favorite==='boolean') {
      const rows=await query('update vocabulary_words set favorite=$1,updated_at=now() where id=$2 and user_id=$3 and deleted_at is null returning id',[body.favorite,id,user.id]);
      return rows.length ? NextResponse.json({ok:true}) : failure(new Error('Word not found.'),404);
    }
    const v=wordSchema.parse(body);
    const rows=await query('update vocabulary_words set word=$1,phonetic=$2,definition_en=$3,translation_ru=$4,translation_kk=$5,example_sentence=$6,notes=$7,category_id=$8,updated_at=now() where id=$9 and user_id=$10 and deleted_at is null returning id',[v.word,v.phonetic,v.definition_en,v.translation_ru,v.translation_kk,v.example_sentence,v.notes,v.category_id,id,user.id]);
    return rows.length ? NextResponse.json({ok:true}) : failure(new Error('Word not found.'),404);
  } catch(error) { return failure(error); }
}
export async function DELETE(_request:Request,{params}:Params) {
  const user=await authorized(); if (isResponse(user)) return user;
  try { const {id}=await params; z.uuid().parse(id); const rows=await query('update vocabulary_words set deleted_at=now(),updated_at=now() where id=$1 and user_id=$2 and deleted_at is null returning id',[id,user.id]); return rows.length ? NextResponse.json({ok:true}) : failure(new Error('Word not found.'),404); } catch(error) { return failure(error); }
}
