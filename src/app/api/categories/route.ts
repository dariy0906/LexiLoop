import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { query } from '@/lib/db';
export async function POST(request:Request) {
  const user=await authorized(); if(isResponse(user)) return user;
  try { const {name}=z.object({name:z.string().trim().min(1).max(80)}).parse(await request.json()); const rows=await query<{id:string}>('insert into categories(user_id,name) values($1,$2) returning id',[user.id,name]); return NextResponse.json({id:rows[0].id},{status:201}); }
  catch(error) { if(typeof error==='object' && error && 'code' in error && error.code==='23505') return failure(new Error('Category already exists.'),409); return failure(error); }
}
