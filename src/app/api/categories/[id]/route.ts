import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { pool,query } from '@/lib/db';
type Params={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Params) {
  const user=await authorized(); if(isResponse(user)) return user;
  try { const {id}=await params; z.uuid().parse(id); const {name}=z.object({name:z.string().trim().min(1).max(80)}).parse(await request.json()); const rows=await query('update categories set name=$1,updated_at=now() where id=$2 and user_id=$3 and deleted_at is null returning id',[name,id,user.id]); return rows.length ? NextResponse.json({ok:true}) : failure(new Error('Category not found.'),404); }
  catch(error) { return failure(error); }
}
export async function DELETE(_request:Request,{params}:Params) {
  const user=await authorized(); if(isResponse(user)) return user;
  const client=await pool().connect();
  try { const {id}=await params; z.uuid().parse(id); await client.query('begin'); const {rowCount}=await client.query('update categories set deleted_at=now(),updated_at=now() where id=$1 and user_id=$2 and deleted_at is null',[id,user.id]); if(!rowCount) { await client.query('rollback'); return failure(new Error('Category not found.'),404); } await client.query('update vocabulary_words set category_id=null,updated_at=now() where category_id=$1 and user_id=$2',[id,user.id]); await client.query('commit'); return NextResponse.json({ok:true}); }
  catch(error) { await client.query('rollback'); return failure(error); } finally { client.release(); }
}
