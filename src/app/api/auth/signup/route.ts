import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { query } from '@/lib/db';
import { startSession } from '@/lib/session';
import { failure,tooMany } from '@/lib/api';
import { clientIp,rateLimit } from '@/lib/rate-limit';
const schema = z.object({ email:z.email().max(254).transform((v)=>v.toLowerCase()), password:z.string().min(8).max(200), displayName:z.string().trim().max(80).default('') });
export async function POST(request: Request) {
  try {
    const ipLimit=rateLimit(`signup:ip:${clientIp(request)}`,20,60*60*1000);
    if(!ipLimit.allowed)return tooMany(ipLimit.retryAfter);
    const value = schema.parse(await request.json());
    const passwordHash = await hash(value.password,12);
    const rows = await query<{id:string}>('insert into users(email,password_hash,display_name) values($1,$2,$3) returning id',[value.email,passwordHash,value.displayName]);
    await startSession(rows[0].id);
    return NextResponse.json({ ok:true });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') return failure(new Error('An account with this email already exists.'),409);
    return failure(error);
  }
}
