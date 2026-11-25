import { timingSafeEqual } from 'node:crypto';
import { prepareUpcomingWordly } from '@/lib/gamificationServer';
function validAuthorization(header:string|null,expected:string):boolean{
  const prefix='Bearer ',value=header??'';
  if(!value.startsWith(prefix))return false;
  const actual=Buffer.from(value.slice(prefix.length)),wanted=Buffer.from(expected);
  return actual.length===wanted.length&&timingSafeEqual(actual,wanted);
}
export async function POST(request:Request){
  const expected=process.env.CRON_SECRET;
  if(!expected)return Response.json({error:'CRON_SECRET is not configured.'},{status:503});
  if(!validAuthorization(request.headers.get('authorization'),expected))return Response.json({error:'Unauthorized.'},{status:401});
  return Response.json(await prepareUpcomingWordly());
}
