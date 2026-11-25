export const XP_RULES = {
  lessonComplete: 20,
  lessonCorrect: 3,
  wordlyByAttempt: [35, 28, 22, 16, 10, 5],
  arenaRoundCorrect: 5,
  arenaRoundWin: 10,
  arenaMatchWin: 30,
  arenaDifficultyBonus: { A1:0, A2:0, B1:0, B2:5, C1:10, C2:15 },
} as const;

export const DIFFICULTIES = ['A1','A2','B1','B2','C1','C2'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export type GameQuestionType = 'translation'|'definition'|'sentence_completion'|'reverse_translation'|'recall'|'context'|'synonym'|'antonym';
export const SPECTATORS:Record<Difficulty,number>={A1:10,A2:15,B1:25,B2:40,C1:60,C2:100};
export const DIFFICULTY_RATING:Record<Difficulty,number>={A1:180,A2:300,B1:450,B2:600,C1:760,C2:900};

export function xpForLevel(level:number):number {
  const n=Math.max(0,Math.floor(level)-1);
  return 25*n*n+75*n;
}
export function levelFromXp(xp:number):{level:number;current:number;next:number;progress:number} {
  let level=1;
  while(xpForLevel(level+1)<=xp) level++;
  const current=xpForLevel(level),next=xpForLevel(level+1);
  return {level,current,next,progress:next===current?1:(xp-current)/(next-current)};
}

export function validTimezone(value:string):boolean {
  try { new Intl.DateTimeFormat('en-US',{timeZone:value}).format(); return true; } catch { return false; }
}
export function localDate(timezone:string,at=new Date()):string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);
  const get=(type:string)=>parts.find((p)=>p.type===type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addCalendarDays(date:string,days:number):string {
  const value=new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate()+days); return value.toISOString().slice(0,10);
}
export function dateKey(value:string|Date|null):string|null {
  if(value===null)return null;
  if(value instanceof Date)return value.toISOString().slice(0,10);
  return value.slice(0,10);
}
export function hoursUntilNextLocalDay(timezone:string,at=new Date()):number {
  const today=localDate(timezone,at);
  let low=at.getTime(),high=low+30*60*60*1000;
  for(let i=0;i<32;i++){const mid=Math.floor((low+high)/2);if(localDate(timezone,new Date(mid))===today)low=mid+1;else high=mid;}
  return Math.max(0,(high-at.getTime())/3_600_000);
}
export function updateStreak(current:number,longest:number,lastDate:string|Date|null,today:string|Date){
  const previous=dateKey(lastDate),currentDate=dateKey(today)!;
  if(previous===currentDate)return {current,longest,lastDate:currentDate};
  const next=previous===addCalendarDays(currentDate,-1)?current+1:1;
  return {current:next,longest:Math.max(longest,next),lastDate:currentDate};
}

export type AnswerSignal={questionType:string;difficulty:Difficulty;correct:boolean;responseMs:number;createdAt?:string};
export type SkillProfile={rating:number;avgResponseMs:number;sampleSize:number;dimensions:Record<string,{rating:number;sampleSize:number}>;calibrating:boolean};
export function computeSkill(answers:AnswerSignal[],previous=500):SkillProfile {
  const recent=answers.slice(-50); let rating=previous;
  const dims:Record<string,{rating:number;sampleSize:number}>={};
  let speed=0,weightTotal=0;
  recent.forEach((answer,index)=>{
    const recency=.35+.65*((index+1)/Math.max(1,recent.length));
    const expected=1/(1+Math.pow(10,(DIFFICULTY_RATING[answer.difficulty]-rating)/400));
    const delta=26*recency*((answer.correct?1:0)-expected);
    rating=Math.max(0,Math.min(1000,rating+delta));
    const current=dims[answer.questionType]??{rating:500,sampleSize:0};
    const dimExpected=1/(1+Math.pow(10,(DIFFICULTY_RATING[answer.difficulty]-current.rating)/400));
    current.rating=Math.round(Math.max(0,Math.min(1000,current.rating+22*recency*((answer.correct?1:0)-dimExpected))));
    current.sampleSize++; dims[answer.questionType]=current;
    speed+=Math.max(500,Math.min(15000,answer.responseMs))*recency; weightTotal+=recency;
  });
  return {rating:Math.round(rating),avgResponseMs:recent.length?Math.round(speed/weightTotal):4500,sampleSize:recent.length,dimensions:dims,calibrating:recent.length<20};
}
export type BotProfile={name:string;rating:number;level:number;avgResponseMs:number;dimensions:Record<string,number>;calibrating:boolean};
const BOT_NAMES=['Nova','Lex','Milo','Byte','Echo','Nora','Kai'];
export function createBot(profile:SkillProfile,rng=Math.random):BotProfile {
  const variance=(rng()-.5)*.16;
  const rating=Math.round(Math.max(100,Math.min(950,profile.rating*(1+variance))));
  const dimensions=Object.fromEntries(Object.entries(profile.dimensions).map(([key,value])=>[key,Math.round(Math.max(80,Math.min(970,value.rating*(1+(rng()-.5)*.12))))]));
  const speed=Math.round(Math.max(1500,Math.min(8000,profile.avgResponseMs*(.9+rng()*.25))));
  return {name:BOT_NAMES[Math.floor(rng()*BOT_NAMES.length)]||'Nova',rating,level:levelFromXp(Math.max(0,rating*3)).level,avgResponseMs:speed,dimensions,calibrating:profile.calibrating};
}
export function botOutcome(bot:BotProfile,difficulty:Difficulty,type:string,rng=Math.random){
  const skill=bot.dimensions[type]??bot.rating;
  const probability=Math.max(.08,Math.min(.94,1/(1+Math.pow(10,(DIFFICULTY_RATING[difficulty]-skill)/360))));
  const correct=rng()<probability;
  const factor=1+(DIFFICULTY_RATING[difficulty]-500)/1800;
  const responseMs=Math.round(Math.max(1500,Math.min(8000,bot.avgResponseMs*factor*(.82+rng()*.36))));
  return {correct,responseMs,probability};
}
export function roundWinner(playerCorrect:boolean,botCorrect:boolean,playerMs:number,botMs:number):'player'|'opponent'|'draw' {
  if(playerCorrect&&!botCorrect)return 'player';
  if(botCorrect&&!playerCorrect)return 'opponent';
  if(!playerCorrect&&!botCorrect)return 'draw';
  if(playerMs===botMs)return 'draw';
  return playerMs<botMs?'player':'opponent';
}
