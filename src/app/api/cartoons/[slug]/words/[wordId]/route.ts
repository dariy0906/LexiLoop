import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { cartoonSlugSchema } from '@/lib/cartoons';
import { addCartoonWord } from '@/lib/cartoonsServer';
type Params={params:Promise<{slug:string;wordId:string}>};
export async function POST(_request:Request,{params}:Params){
  const user=await authorized();if(isResponse(user))return user;
  try{
    const {slug,wordId}=await params;
    const outcome=await addCartoonWord(cartoonSlugSchema.parse(slug),z.uuid().parse(wordId),user.id);
    if(outcome.kind==='not-found')return failure(new Error('Cartoon word not found.'),404);
    return Response.json(outcome.result,{status:outcome.kind==='added'?201:200});
  }catch(error){return failure(error);}
}
