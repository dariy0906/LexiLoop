export const instant = false;
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/session';
import { LibraryProvider } from '@/features/library-context';
import { Shell } from '@/components/Shell';
export default async function WorkspaceLayout({children}:{children:React.ReactNode}){
  const user=await getUser(); if(!user)redirect('/sign-in');
  return <LibraryProvider user={user}><Shell>{children}</Shell></LibraryProvider>;
}
