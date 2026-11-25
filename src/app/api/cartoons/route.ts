import { connection } from 'next/server';
import { authorized,isResponse,failure } from '@/lib/api';
import { cartoonLevelSchema } from '@/lib/cartoons';
import { listCartoons } from '@/lib/cartoonsServer';
export async function GET(request:Request){
  await connection();
  const user=await authorized();if(isResponse(user))return user;
  try{
    const raw=new URL(request.url).searchParams.get('level');
    const level=raw?cartoonLevelSchema.parse(raw):undefined;
    return Response.json({lessons:await listCartoons(level)});
  }catch(error){return failure(error);}
}
