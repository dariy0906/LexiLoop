import type { Word } from './types';
import type { Difficulty,GameQuestionType } from './gamification';
import { sentencePrompt } from './practice';

export type ServerQuestion={
  wordId:string;
  type:GameQuestionType;
  difficulty:Difficulty;
  prompt:string;
  options:string[];
  acceptedAnswers:string[];
};

const RELATIONS:Record<string,{synonyms?:string[];antonyms?:string[]}>={
  happy:{synonyms:['glad','joyful','cheerful'],antonyms:['sad','unhappy']},
  resilient:{synonyms:['tough','strong','durable'],antonyms:['fragile','vulnerable']},
  significant:{synonyms:['important','notable','meaningful'],antonyms:['insignificant','minor']},
  brave:{synonyms:['courageous','bold','fearless'],antonyms:['cowardly','afraid']},
  quick:{synonyms:['fast','rapid','swift'],antonyms:['slow','sluggish']},
  difficult:{synonyms:['hard','challenging','tough'],antonyms:['easy','simple']},
};

export function normalizeAnswer(value:string):string {
  return value.trim().toLocaleLowerCase().replace(/[.,!?;:'"()]/g,'').replace(/\s+/g,' ');
}
export function isAccepted(answer:string,accepted:string[]):boolean {
  const value=normalizeAnswer(answer);
  return accepted.some((item)=>normalizeAnswer(item)===value);
}
function distinct(values:(string|null|undefined)[]):string[]{return [...new Set(values.map((v)=>v?.trim()).filter((v):v is string=>Boolean(v)))];}
function shuffle<T>(values:T[],rng=Math.random):T[]{return [...values].sort(()=>rng()-.5);}
function levelFor(word:Word,index:number):Difficulty {
  if(word.mastery_level<=0)return index%2?'A2':'A1';
  if(word.mastery_level===1)return index%2?'B1':'A2';
  if(word.mastery_level===2)return index%2?'B2':'B1';
  return index%3===0?'C1':'B2';
}
function optionsFor(answer:string,pool:string[],rng=Math.random):string[]{
  return shuffle([answer,...shuffle(distinct(pool).filter((item)=>normalizeAnswer(item)!==normalizeAnswer(answer)),rng).slice(0,3)],rng);
}

export function questionForWord(word:Word,all:Word[],index:number,preferred?:GameQuestionType,rng=Math.random):ServerQuestion|null {
  const ru=word.translation_ru?.trim(),kk=word.translation_kk?.trim(),definition=word.definition_en?.trim();
  const relation=RELATIONS[normalizeAnswer(word.word)];
  const available:GameQuestionType[]=[];
  if(ru||kk)available.push('translation','reverse_translation','recall');
  if(definition)available.push('definition');
  if(sentencePrompt(word))available.push('sentence_completion','context');
  if(relation?.synonyms?.length)available.push('synonym');
  if(relation?.antonyms?.length)available.push('antonym');
  if(!available.length)return null;
  const type=preferred&&available.includes(preferred)?preferred:available[index%available.length];
  const difficulty=levelFor(word,index);
  if(type==='translation'){
    const answer=ru||kk!;
    return {wordId:word.id,type,difficulty,prompt:`What does “${word.word}” mean?`,options:optionsFor(answer,all.flatMap((item)=>[item.translation_ru,item.translation_kk].filter(Boolean) as string[]),rng),acceptedAnswers:distinct([ru,kk])};
  }
  if(type==='reverse_translation'){
    const prompt=ru||kk!;
    return {wordId:word.id,type,difficulty,prompt:`Choose the English word for “${prompt}”.`,options:optionsFor(word.word,all.map((item)=>item.word),rng),acceptedAnswers:[word.word]};
  }
  if(type==='definition'){
    return {wordId:word.id,type,difficulty,prompt:`Which word means “${definition}”?`,options:optionsFor(word.word,all.map((item)=>item.word),rng),acceptedAnswers:[word.word]};
  }
  if(type==='sentence_completion'){
    return {wordId:word.id,type,difficulty,prompt:sentencePrompt(word)!,options:optionsFor(word.word,all.map((item)=>item.word),rng),acceptedAnswers:[word.word]};
  }
  if(type==='context'){
    const correct=word.example_sentence!;
    const others=all.filter((item)=>item.id!==word.id).map((item)=>item.example_sentence).filter((item):item is string=>Boolean(item));
    return {wordId:word.id,type,difficulty,prompt:`Choose the sentence that uses “${word.word}” correctly.`,options:optionsFor(correct,others,rng),acceptedAnswers:[correct]};
  }
  if(type==='synonym')return {wordId:word.id,type,difficulty:'C1',prompt:`Write a synonym for “${word.word}”.`,options:[],acceptedAnswers:relation!.synonyms!};
  if(type==='antonym')return {wordId:word.id,type,difficulty:'C1',prompt:`Write an antonym for “${word.word}”.`,options:[],acceptedAnswers:relation!.antonyms!};
  return {wordId:word.id,type:'recall',difficulty,prompt:`Type the meaning of “${word.word}”.`,options:[],acceptedAnswers:distinct([ru,kk,definition])};
}

export function buildQuestions(words:Word[],count:number,preferredTypes:GameQuestionType[]=[],rng=Math.random):ServerQuestion[]{
  const useful=words.filter((word)=>questionForWord(word,words,0,undefined,rng));
  if(!useful.length)return [];
  const ordered=shuffle(useful,rng);
  const result:ServerQuestion[]=[];
  for(let index=0;index<count;index++){
    const word=ordered[index%ordered.length];
    const question=questionForWord(word,words,index,preferredTypes[index%Math.max(1,preferredTypes.length)],rng);
    if(question)result.push(question);
  }
  return result;
}
