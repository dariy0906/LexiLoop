import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getUser, type SessionUser } from './session';
export async function authorized(): Promise<SessionUser | NextResponse> {
  const user = await getUser();
  return user ?? NextResponse.json({ error:'Please sign in.' },{status:401});
}
export function isResponse(value: SessionUser | NextResponse): value is NextResponse { return value instanceof NextResponse; }
export function tooMany(retryAfter: number): NextResponse {
  return NextResponse.json({ error:'Too many attempts. Please try again later.' },{ status:429, headers:{ 'Retry-After':String(retryAfter) } });
}
export function failure(error: unknown, status = 400): NextResponse {
  if (error instanceof ZodError) return NextResponse.json({error:error.issues[0]?.message||'Check your input.'},{status:400});
  if (status >= 500 || (typeof error==='object' && error && 'code' in error)) {
    console.error('LexiLoop request failed',error);
    return NextResponse.json({error:status>=500?'Something went wrong. Please try again.':'Could not save this change. Check your input and try again.'},{status});
  }
  return NextResponse.json({ error:error instanceof Error?error.message:'Request failed.' },{status});
}
