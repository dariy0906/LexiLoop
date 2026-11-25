import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { query } from '@/lib/db';
import { validTimezone } from '@/lib/gamification';
const schema=z.object({timezone:z.string().refine(validTimezone,'Choose a valid timezone.')});
export async function PATCH(request:Request){
  const user=await authorized();if(isResponse(user))return user;
  try{const {timezone}=schema.parse(await request.json());await query('update users set timezone=$1 where id=$2',[timezone,user.id]);return Response.json({ok:true,timezone});}catch(error){return failure(error);}
}
