import type pg from 'pg';
import { pool,query } from './db';
import type { AddCartoonWordResult,CartoonLevel,CartoonLessonDetail,CartoonLessonSummary,CartoonProgress,CartoonScene,CartoonWord } from './cartoons';

type LessonRow={id:string;slug:string;title:string;level:CartoonLevel;duration_seconds:number;description:string;cover_emoji:string;cover_color:string;youtube_video_id:string|null;youtube_title:string|null;scenes:CartoonScene[];word_count?:number;scene_count?:number};
type WordRow={id:string;word:string;phonetic:string|null;translation_ru:string;translation_kk:string;definition_en:string;example_sentence:string;difficulty:CartoonLevel;position:number;added:boolean;mastery_level:number};
type CartoonWordRow={id:string;word:string;phonetic:string|null;translation_ru:string;translation_kk:string;definition_en:string;example_sentence:string;difficulty:CartoonLevel;position:number;lesson_id:string;slug:string};

function mapWord(row:WordRow):CartoonWord{
  return {id:row.id,word:row.word,phonetic:row.phonetic,translationRu:row.translation_ru,translationKk:row.translation_kk,definitionEn:row.definition_en,exampleSentence:row.example_sentence,difficulty:row.difficulty,position:row.position,added:row.added,masteryLevel:row.mastery_level};
}
function mapSummary(row:LessonRow):CartoonLessonSummary{
  return {id:row.id,slug:row.slug,title:row.title,level:row.level,durationSeconds:row.duration_seconds,description:row.description,coverEmoji:row.cover_emoji,coverColor:row.cover_color,youtubeVideoId:row.youtube_video_id,youtubeTitle:row.youtube_title,wordCount:Number(row.word_count??0),sceneCount:Number(row.scene_count??row.scenes.length)};
}
function progressFromWords(words:CartoonWord[]):CartoonProgress{
  return {added:words.filter((word)=>word.added).length,learned:words.filter((word)=>word.added&&word.masteryLevel>=1).length,total:words.length};
}
async function lessonProgress(client:pg.PoolClient,lessonId:string,userId:string):Promise<CartoonProgress>{
  const row=(await client.query<CartoonProgress>(`select count(*)::int total,
    count(v.id)::int added,
    count(*) filter(where v.mastery_level>=1)::int learned
    from cartoon_lesson_words w
    left join lateral (
      select id,mastery_level from vocabulary_words
      where user_id=$2 and deleted_at is null and lower(word)=lower(w.word)
      order by created_at limit 1
    ) v on true
    where w.lesson_id=$1`,[lessonId,userId])).rows[0];
  return {added:Number(row.added),learned:Number(row.learned),total:Number(row.total)};
}
export async function listCartoons(level?:CartoonLevel):Promise<CartoonLessonSummary[]>{
  const rows=await query<LessonRow>(`select l.id,l.slug,l.title,l.level,l.duration_seconds,l.description,l.cover_emoji,l.cover_color,l.youtube_video_id,l.youtube_title,l.scenes,
    jsonb_array_length(l.scenes)::int scene_count,
    (select count(*)::int from cartoon_lesson_words w where w.lesson_id=l.id) word_count
    from cartoon_lessons l
    where ($1::text is null or l.level=$1)
    order by case l.level when 'A1' then 1 when 'A2' then 2 when 'B1' then 3 when 'B2' then 4 when 'C1' then 5 else 6 end,l.title`,[level??null]);
  return rows.map(mapSummary);
}
export async function loadCartoon(slug:string,userId:string):Promise<CartoonLessonDetail|null>{
  const lesson=(await query<LessonRow>('select id,slug,title,level,duration_seconds,description,cover_emoji,cover_color,youtube_video_id,youtube_title,scenes from cartoon_lessons where slug=$1',[slug]))[0];
  if(!lesson)return null;
  const words=(await query<WordRow>(`select w.id,w.word,w.phonetic,w.translation_ru,w.translation_kk,w.definition_en,w.example_sentence,w.difficulty,w.position,
    (v.id is not null) added,coalesce(v.mastery_level,0) mastery_level
    from cartoon_lesson_words w
    left join lateral (
      select id,mastery_level from vocabulary_words
      where user_id=$2 and deleted_at is null and lower(word)=lower(w.word)
      order by created_at limit 1
    ) v on true
    where w.lesson_id=$1 order by w.position`,[lesson.id,userId])).map(mapWord);
  return {...mapSummary({...lesson,word_count:words.length,scene_count:lesson.scenes.length}),scenes:lesson.scenes,words,progress:progressFromWords(words)};
}
export async function addCartoonWord(slug:string,wordId:string,userId:string):Promise<{kind:'not-found'}|{kind:'added'|'exists';result:AddCartoonWordResult}>{
  const client=await pool().connect();
  try{
    await client.query('begin');
    const word=(await client.query<CartoonWordRow>(`select w.id,w.word,w.phonetic,w.translation_ru,w.translation_kk,w.definition_en,w.example_sentence,w.difficulty,w.position,
      l.id lesson_id,l.slug
      from cartoon_lesson_words w join cartoon_lessons l on l.id=w.lesson_id
      where w.id=$1 and l.slug=$2`,[wordId,slug])).rows[0];
    if(!word){await client.query('rollback');return {kind:'not-found'};}
    await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${userId}:${word.word.toLocaleLowerCase()}`]);
    const existing=(await client.query<{id:string}>('select id from vocabulary_words where user_id=$1 and deleted_at is null and lower(word)=lower($2) order by created_at limit 1',[userId,word.word])).rows[0];
    if(existing){
      const progress=await lessonProgress(client,word.lesson_id,userId);
      await client.query('commit');
      return {kind:'exists',result:{added:false,wordId:existing.id,message:'This word is already in your vocabulary.',progress}};
    }
    const inserted=(await client.query<{id:string}>('insert into vocabulary_words(user_id,word,phonetic,definition_en,translation_ru,translation_kk,example_sentence,notes,category_id) values($1,$2,$3,$4,$5,$6,$7,null,null) returning id',[userId,word.word,word.phonetic,word.definition_en,word.translation_ru,word.translation_kk,word.example_sentence])).rows[0];
    await client.query('insert into review_state(id,user_id,word_id) values($1,$2,$3)',[inserted.id,userId,inserted.id]);
    const progress=await lessonProgress(client,word.lesson_id,userId);
    await client.query('commit');
    return {kind:'added',result:{added:true,wordId:inserted.id,message:'Added to your vocabulary.',progress}};
  }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}
