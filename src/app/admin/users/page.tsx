import { ShieldCheck, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/session';

export const instant = false;

type DemoRow = { id: string; display_name: string; email: string; created_at: Date };
function administratorEmails() { return new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)); }
export default async function AdminUsersPage() {
  await connection();
  if (process.env.NODE_ENV === 'production') { const user = await getUser(); if (!user) redirect('/sign-in'); if (!administratorEmails().has(user.email.toLowerCase())) redirect('/dashboard'); }
  const users = await query<DemoRow>('select id,display_name,email,created_at from users where is_demo=true order by created_at asc, id asc');
  return <main className="admin-users-page"><section className="admin-users-hero"><div><span className="eyebrow"><ShieldCheck size={15}/> ADMINISTRATION</span><h1>Demo users</h1><p>32 isolated demonstration records. They cannot sign in and are excluded from real-user activity jobs.</p></div><div className="admin-users-total"><Users size={22}/><strong>{users.length}</strong><span>demo accounts</span></div></section><section className="admin-users-card"><div className="admin-users-card-head"><div><span className="eyebrow">DIRECTORY</span><h2>Demo account registry</h2></div><span className="admin-status"><i/> Demo only</span></div><div className="admin-table-wrap"><table><thead><tr><th>№</th><th>Full name</th><th>Email</th><th>Registration date</th><th>Status</th></tr></thead><tbody>{users.map((user,index)=><tr key={user.id}><td>{index+1}</td><td><strong>{user.display_name}</strong></td><td><a href={`mailto:${user.email}`}>{user.email}</a></td><td>{new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(user.created_at)}</td><td><span className="demo-badge">Demo</span></td></tr>)}</tbody></table></div></section></main>;
}
