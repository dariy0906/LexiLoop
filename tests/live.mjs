import assert from 'node:assert/strict';
import pg from 'pg';
const base=process.env.LEXILOOP_TEST_URL||'http://127.0.0.1:3000';
const stamp=crypto.randomUUID();
const emails=[`site-test-a-${stamp}@example.test`,`site-test-b-${stamp}@example.test`];
const password=`Test!${crypto.randomUUID()}`;
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function call(path,method='GET',body,cookie=''){
  const response=await fetch(base+'/api'+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
  let data;try{data=await response.json();}catch{data={};}
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
}
function ok(result,status=200){assert.equal(result.status,status,JSON.stringify(result.data));return result.data;}
try{
  assert.equal((await call('/library')).status,401,'auth guard');
  const a=await call('/auth/signup','POST',{email:emails[0],password,displayName:'Test A'});ok(a);assert(a.cookie);
  const b=await call('/auth/signup','POST',{email:emails[1],password,displayName:'Test B'});ok(b);assert(b.cookie);
  assert.equal(ok(await call('/auth/me','GET',null,a.cookie)).user.email,emails[0],'session restore');
  const category=ok(await call('/categories','POST',{name:'School'},a.cookie),201).id;
  const draft={word:'resilient',phonetic:null,definition_en:'able to recover',translation_ru:'стойкий',translation_kk:null,example_sentence:'The resilient student kept trying.',notes:null,category_id:category};
  const id=ok(await call('/words','POST',draft,a.cookie),201).id;
  ok(await call('/words/'+id,'PATCH',{favorite:true},a.cookie));
  ok(await call('/words/'+id,'PATCH',{...draft,notes:'edited'},a.cookie));
  const own=ok(await call('/library','GET',null,a.cookie));assert.equal(own.words.find(w=>w.id===id).favorite,true);assert.equal(own.words.find(w=>w.id===id).notes,'edited');
  assert.equal(ok(await call('/library','GET',null,b.cookie)).words.length,0,'private vocabulary');
  assert.equal((await call('/words/'+id,'PATCH',{favorite:false},b.cookie)).status,404,'cannot edit another user word');
  const eventId=crypto.randomUUID();ok(await call('/review','POST',{wordId:id,rating:'Good',eventId},a.cookie));assert.equal(ok(await call('/review','POST',{wordId:id,rating:'Good',eventId},a.cookie)).duplicate,true);
  const practice=ok(await call('/practice','POST',{wordId:id,mode:'sentence',answer:' resilient ',correct:false},a.cookie),201);assert.equal(practice.correct,true);
  ok(await call('/profile','PATCH',{display_name:'Updated A',daily_review_goal:5,language_preference:'ru',research_enabled:false,participant_code:null},a.cookie));
  const after=ok(await call('/library','GET',null,a.cookie));assert.equal(after.events.length,1);assert.equal(after.practice.length,1);assert.equal(after.practice[0].correct,true);assert.equal(after.user.display_name,'Updated A');assert.equal(after.states.find(s=>s.word_id===id).repetitions,1);
  const bulk=ok(await call('/words/bulk','POST',{words:[{...draft,word:'curious',category_id:null},{...draft,word:'brave',category_id:null}]},a.cookie),201);assert.equal(bulk.count,2);
  ok(await call('/words/'+id,'DELETE',null,a.cookie));assert.equal(ok(await call('/library','GET',null,a.cookie)).words.length,2,'soft deletion');
  ok(await call('/auth/signout','POST',null,a.cookie));assert.equal((await call('/auth/me','GET',null,a.cookie)).status,401,'sign out');
  const signin=await call('/auth/signin','POST',{email:emails[0],password});ok(signin);assert(signin.cookie);assert.equal(ok(await call('/auth/me','GET',null,signin.cookie)).user.email,emails[0],'sign back in');
  console.log('Live PostgreSQL flow passed: auth, session restore, CRUD, favorites, bulk add, review idempotency, practice, settings, isolation, sign out/in.');
}finally{
  await db.query('delete from users where email=any($1)',[emails]);
  await db.end();
}
