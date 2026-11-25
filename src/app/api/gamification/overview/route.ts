import { connection } from 'next/server';
import { authorized,isResponse,failure } from '@/lib/api';
import { gameOverview,timezoneForUser } from '@/lib/gamificationServer';
export async function GET(){
  await connection();
  const user=await authorized();if(isResponse(user))return user;
  try{return Response.json(await gameOverview(user.id,await timezoneForUser(user.id)));}catch(error){return failure(error,500);}
}
