import assert from 'node:assert/strict';
import pg from 'pg';
const base=process.env.LEXILOOP_TEST_URL||'http://127.0.0.1:3000',stamp=crypto.randomUUID();
const emails=[`cartoon-a-${stamp}@example.test`,`cartoon-b-${stamp}@example.test`],password=`Test!${crypto.randomUUID()}`;
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function call(path,method='GET',body,cookie=''){const response=await fetch(base+'/api'+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});let data;try{data=await response.json();}catch{data={};}return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};}
function ok(result,status=200){assert.equal(result.status,status,JSON.stringify(result.data));return result.data;}
try{
  assert.equal((await call('/cartoons')).status,401,'auth guard');
  const a=await call('/auth/signup','POST',{email:emails[0],password,displayName:'Cartoon A'});ok(a);
  const b=await call('/auth/signup','POST',{email:emails[1],password,displayName:'Cartoon B'});ok(b);
  const levels=['A1','A2','B1','B2','C1','C2'],lists={};
  for(const level of levels){
    const data=ok(await call('/cartoons?level='+level,'GET',null,a.cookie));
    assert.ok(data.lessons.length>=1,level+' has a lesson');
    assert.ok(data.lessons.every((lesson)=>lesson.level===level));
    lists[level]=data.lessons;
  }
  const a1=lists.A1[0],a2=lists.A2[0];
  const detail=ok(await call('/cartoons/'+a1.slug,'GET',null,a.cookie)).lesson;
  assert.equal(detail.level,'A1');assert.ok(detail.scenes.length>=1);assert.ok(detail.words.length>=15);assert.ok(detail.words.some((word)=>word.word==='picked up')); assert.equal(detail.progress.total,detail.words.length);assert.equal(detail.progress.added,0);
  const otherDetail=ok(await call('/cartoons/'+a2.slug,'GET',null,b.cookie)).lesson;
  assert.equal(otherDetail.progress.added,0);
  const firstWord=detail.words[0],secondWord=detail.words[1];
  assert.equal((await call('/cartoons/'+a1.slug+'/words/'+firstWord.id,'POST',null)).status,401,'add requires auth');
  const added=ok(await call('/cartoons/'+a1.slug+'/words/'+firstWord.id,'POST',null,a.cookie),201);assert.equal(added.added,true);assert.equal(added.progress.added,1);assert.ok(added.wordId);
  const duplicate=ok(await call('/cartoons/'+a1.slug+'/words/'+firstWord.id,'POST',null,a.cookie));assert.equal(duplicate.added,false);assert.equal(duplicate.wordId,added.wordId);assert.match(duplicate.message,/already/i);assert.equal(duplicate.progress.added,1);
  const libraryA=ok(await call('/library','GET',null,a.cookie));
  assert.equal(libraryA.words.filter((word)=>word.id===added.wordId).length,1);assert.ok(libraryA.states.some((state)=>state.word_id===added.wordId));
  const bIsolated=ok(await call('/cartoons/'+a1.slug,'GET',null,b.cookie)).lesson;assert.equal(bIsolated.progress.added,0);
  const addedB=ok(await call('/cartoons/'+a1.slug+'/words/'+firstWord.id,'POST',null,b.cookie),201);assert.equal(addedB.added,true);assert.equal(addedB.progress.added,1);
  const aStillOne=ok(await call('/cartoons/'+a1.slug,'GET',null,a.cookie)).lesson;assert.equal(aStillOne.progress.added,1,'A progress is not changed by B');
  ok(await call('/cartoons/'+a1.slug+'/words/'+secondWord.id,'POST',null,a.cookie),201);
  const aTwo=ok(await call('/cartoons/'+a1.slug,'GET',null,a.cookie)).lesson,bOne=ok(await call('/cartoons/'+a1.slug,'GET',null,b.cookie)).lesson;
  assert.equal(aTwo.progress.added,2);assert.equal(bOne.progress.added,1);
  const a2Word=ok(await call('/cartoons/'+a2.slug,'GET',null,a.cookie)).lesson.words[0];
  assert.equal((await call('/cartoons/'+a1.slug+'/words/'+a2Word.id,'POST',null,a.cookie)).status,404,'word must belong to lesson');
  assert.equal((await call('/cartoons?level=Z9','GET',null,a.cookie)).status,400,'level validation');
  assert.equal((await call('/cartoons/Bad_Slug','GET',null,a.cookie)).status,400,'slug validation');
  console.log('Cartoon live flow passed: level lists, lesson detail, word progression, dictionary/review creation, duplicate handling, validation, and user isolation.');
}finally{await db.query('delete from users where email=any($1)',[emails]);await db.end();}
