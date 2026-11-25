import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from './db';
const cookieName = 'lexiloop_site_session';
const thirtyDays = 30 * 24 * 60 * 60;
export type SessionUser = { id: string; email: string; display_name: string; daily_review_goal: number; language_preference: string; research_enabled: boolean; participant_code: string | null; timezone:string };
export function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const rows = await query<SessionUser>('select u.id,u.email,u.display_name,u.daily_review_goal,u.language_preference,u.research_enabled,u.participant_code,u.timezone from sessions s join users u on u.id=s.user_id where s.token_hash=$1 and s.expires_at>now()', [hashToken(token)]);
  return rows[0] ?? null;
}
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  await query('delete from sessions where expires_at<=now()');
  await query('insert into sessions(token_hash,user_id,expires_at) values($1,$2,now()+interval \'30 days\')', [hashToken(token),userId]);
  (await cookies()).set(cookieName,token,{ httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:thirtyDays });
}
export async function endSession(): Promise<void> {
  const jar = await cookies(); const token = jar.get(cookieName)?.value;
  if (token) await query('delete from sessions where token_hash=$1',[hashToken(token)]);
  jar.delete(cookieName);
}
