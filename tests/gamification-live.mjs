import assert from 'node:assert/strict';
import pg from 'pg';
const base=process.env.LEXILOOP_TEST_URL||'http://127.0.0.1:3000',stamp=crypto.randomUUID();
const emails=[`game-a-${stamp}@example.test`,`game-b-${stamp}@example.test`],password=`Test!${crypto.randomUUID()}`;
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function call(path,method='GET',body,cookie=''){const response=await fetch(base+'/api'+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});let data;try{data=await response.json();}catch{data={};}return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};}
function ok(result,status=200){assert.equal(result.status,status,JSON.stringify(result.data));return result.data;}
try{
  const a=await call('/auth/signup','POST',{email:emails[0],password,displayName:'Game A'});ok(a);const b=await call('/auth/signup','POST',{email:emails[1],password,displayName:'Game B'});ok(b);
  const userA=ok(await call('/auth/me','GET',null,a.cookie)).user;
  const words=[['resilient','стойкий'],['curious','любопытный'],['patient','терпеливый'],['brave','смелый'],['significant','значительный'],['gentle','мягкий'],['honest','честный'],['steady','устойчивый'],['clever','умный'],['bright','яркий']];
  for(const [word,translation] of words)ok(await call('/words','POST',{word,phonetic:null,definition_en:'definition of '+word,translation_ru:translation,translation_kk:null,example_sentence:'The '+word+' learner kept trying.',notes:null,category_id:null},a.cookie),201);
  const overview=ok(await call('/gamification/overview','GET',null,a.cookie));assert.equal(overview.totalXp,0);assert.equal(overview.currentStreak,0);
  assert.equal(overview.unlocks.wordly,false);
  assert.equal((await call('/gamification/wordly','GET',null,a.cookie)).status,403);
  for(let n=0;n<5;n++){const lesson=ok(await call('/gamification/lessons/start','POST',{count:5},a.cookie),201);for(const question of lesson.questions)ok(await call('/gamification/lessons/answer','POST',{sessionId:lesson.sessionId,position:question.position,answer:question.options[0]||'test',responseMs:3500},a.cookie));}
  assert.equal(ok(await call('/gamification/overview','GET',null,a.cookie)).unlocks.wordly,true);
  const first=ok(await call('/gamification/wordly','GET',null,a.cookie)).wordly,again=ok(await call('/gamification/wordly','GET',null,a.cookie)).wordly;assert.equal(first.id,again.id);assert.equal(first.localDate,again.localDate);
  const requestId=crypto.randomUUID(),firstGuess=ok(await call('/gamification/wordly','POST',{guess:'zzzz',requestId},a.cookie)),repeatedGuess=ok(await call('/gamification/wordly','POST',{guess:'zzzz',requestId},a.cookie));assert.equal(repeatedGuess.wordly.attempts,firstGuess.wordly.attempts);
  const target=(await db.query('select w.word from daily_wordly_assignments d join vocabulary_words w on w.id=d.word_id where d.user_id=$1 order by d.created_at desc limit 1',[userA.id])).rows[0].word;
  const wordlyResult=ok(await call('/gamification/wordly','POST',{guess:target},a.cookie));assert.equal(wordlyResult.correct,true);assert.ok(wordlyResult.xpEarned>0);
  const reopen=ok(await call('/gamification/wordly','POST',{guess:'resilient'},a.cookie));assert.equal(reopen.xpEarned,0);
  async function finishLesson(){
    const lesson=ok(await call('/gamification/lessons/start','POST',{count:5},a.cookie),201);let last;
    for(const question of lesson.questions){const answer=question.options[0]||'test';last=ok(await call('/gamification/lessons/answer','POST',{sessionId:lesson.sessionId,position:question.position,answer,responseMs:3500.5},a.cookie));}
    assert.equal(last.completed,true);return {lesson,last};
  }
  const one=await finishLesson();assert.equal(one.last.result.streak.current,1);const duplicate=ok(await call('/gamification/lessons/answer','POST',{sessionId:one.lesson.sessionId,position:5,answer:'anything',responseMs:3000},a.cookie));assert.equal(duplicate.duplicate,true);assert.equal(duplicate.completed,true);assert.ok(duplicate.result);
  const two=await finishLesson();assert.equal(two.last.result.streak.current,1);
  const staleLesson=ok(await call('/gamification/lessons/start','POST',{count:5},a.cookie),201);ok(await call('/gamification/lessons/start','POST',{count:5},a.cookie),201);
  const staleLessonAnswer=await call('/gamification/lessons/answer','POST',{sessionId:staleLesson.sessionId,position:1,answer:'test',responseMs:1},a.cookie);assert.equal(staleLessonAnswer.status,409);
  assert.equal((await call('/gamification/arena/start','POST',null,a.cookie)).status,403);
  for(const word of ['adaptable','accurate','balance','calm','creative','daring','eager','focused','generous','humble','inspired','joyful','kind','loyal','mindful'])ok(await call('/words','POST',{word,phonetic:null,definition_en:'A useful quality.',translation_ru:'качество '+word,translation_kk:null,example_sentence:'A '+word+' learner kept trying.',notes:null,category_id:null},a.cookie),201);
  await db.query('update user_gamification set total_xp=10450 where user_id=$1',[userA.id]);
  assert.equal(ok(await call('/gamification/overview','GET',null,a.cookie)).unlocks.arena,true);
  const staleArena=ok(await call('/gamification/arena/start','POST',null,a.cookie),201),arena=ok(await call('/gamification/arena/start','POST',null,a.cookie),201);assert.equal(arena.opponent.type,'BOT');assert.equal(arena.round.number,1);
  const staleArenaAnswer=await call('/gamification/arena/'+staleArena.matchId+'/answer','POST',{round:1,answer:'x',responseMs:1},a.cookie);assert.equal(staleArenaAnswer.status,409);
  const outOfOrder=await call('/gamification/arena/'+arena.matchId+'/answer','POST',{round:2,answer:'x',responseMs:1},a.cookie);assert.equal(outOfOrder.status,409);
  let round=arena.round,arenaResult;
  for(let number=1;number<=3;number++){const answer=round.options[0]||'test';arenaResult=ok(await call('/gamification/arena/'+arena.matchId+'/answer','POST',{round:number,answer,responseMs:number===1?-100:3200,spectators:999999,botCorrect:false},a.cookie));if(arenaResult.next)round=arenaResult.next;}
  assert.equal(arenaResult.completed,true);assert.ok(['player','opponent','draw'].includes(arenaResult.result.winner));
  const arenaDuplicate=ok(await call('/gamification/arena/'+arena.matchId+'/answer','POST',{round:3,answer:'anything',responseMs:1000},a.cookie));assert.equal(arenaDuplicate.duplicate,true);assert.equal(arenaDuplicate.completed,true);assert.ok(arenaDuplicate.result);
  const stolen=await call('/gamification/arena/'+arena.matchId+'/answer','POST',{round:1,answer:'x',responseMs:1},b.cookie);assert.equal(stolen.status,404);
  const game=ok(await call('/gamification/overview','GET',null,a.cookie));assert.ok(game.totalXp>wordlyResult.xpEarned);assert.equal(game.currentStreak,1);assert.ok(game.skill.sampleSize>=10);
  const gameAgain=ok(await call('/gamification/overview','GET',null,a.cookie));assert.equal(gameAgain.skill.rating,game.skill.rating);
  const other=ok(await call('/gamification/overview','GET',null,b.cookie));assert.equal(other.totalXp,0);assert.equal(other.currentStreak,0);
  ok(await call('/words','POST',{word:'solo',phonetic:null,definition_en:'alone',translation_ru:'один',translation_kk:null,example_sentence:'A solo learner kept trying.',notes:null,category_id:null},b.cookie),201);
  assert.equal((await call('/gamification/lessons/start','POST',{count:5},b.cookie)).status,409);
  assert.equal((await call('/gamification/arena/start','POST',null,b.cookie)).status,403);
  const firstAward=(await db.query("select award_xp($1,'test_reward','same-source',7) value",[userA.id])).rows[0].value;
  const secondAward=(await db.query("select award_xp($1,'test_reward','same-source',7) value",[userA.id])).rows[0].value;assert.equal(firstAward,7);assert.equal(secondAward,0);
  console.log('Gamification live flow passed: XP idempotency, Wordly stability/reward, lesson streak, adaptive Arena, server authority, and user isolation.');
}finally{await db.query('delete from users where email=any($1)',[emails]);await db.end();}
