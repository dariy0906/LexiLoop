import { connection } from 'next/server';
import { authorized,isResponse,failure } from '@/lib/api';
import { cartoonSlugSchema } from '@/lib/cartoons';
import { loadCartoon } from '@/lib/cartoonsServer';
type Params={params:Promise<{slug:string}>};
export async function GET(_request:Request,{params}:Params){
  await connection();
  const user=await authorized();if(isResponse(user))return user;
  try{
    const {slug}=await params;
    const lesson=await loadCartoon(cartoonSlugSchema.parse(slug),user.id);
    if(!lesson)return failure(new Error('Cartoon lesson not found.'),404);
    return Response.json({lesson});
  }catch(error){return failure(error);}
}
