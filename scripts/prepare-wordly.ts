import { prepareUpcomingWordly } from '../src/lib/gamificationServer';
import { pool } from '../src/lib/db';

async function main(){
  try{
    const result=await prepareUpcomingWordly();
    console.log(JSON.stringify(result));
    if(result.errors>0)process.exitCode=1;
  }finally{
    await pool().end();
  }
}

void main();
