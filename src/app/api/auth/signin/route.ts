import { NextResponse } from 'next/server';
import { z } from 'zod';
import { compare } from 'bcryptjs';
import { query } from '@/lib/db';
import { startSession } from '@/lib/session';
import { failure,tooMany } from '@/lib/api';
import { clientIp,rateLimit } from '@/lib/rate-limit';
const schema=z.object({email:z.email().transform((v)=>v.toLowerCase()),password:z.string()});
export async function POST(request:Request) {
  try {
    const ipLimit=rateLimit(`signin:ip:${clientIp(request)}`,30,10*60*1000);
    if(!ipLimit.allowed)return tooMany(ipLimit.retryAfter);
    const value=schema.parse(await request.json());
    const emailLimit=rateLimit(`signin:email:${value.email}`,10,10*60*1000);
    if(!emailLimit.allowed)return tooMany(emailLimit.retryAfter);
    const rows=await query<{id:string;password_hash:string}>('select id,password_hash from users where email=$1 and is_demo=false',[value.email]);
    if (!rows[0] || !(await compare(value.password,rows[0].password_hash))) return failure(new Error('Email or password is incorrect.'),401);
    await startSession(rows[0].id);
    return NextResponse.json({ok:true});
  } catch(error) { return failure(error); }
}
