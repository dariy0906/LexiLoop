import { z } from 'zod';
export const CARTOON_LEVELS = ['A1','A2','B1','B2','C1','C2'] as const;
export type CartoonLevel = typeof CARTOON_LEVELS[number];
export const cartoonLevelSchema = z.enum(CARTOON_LEVELS);
export const cartoonSlugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Invalid cartoon slug.');
export type CartoonScene = { position:number; title:string; subtitleEn:string; translation:string; illustration:string; durationSeconds:number };
export type CartoonWord = {
  id:string; word:string; phonetic:string|null; translationRu:string; translationKk:string;
  definitionEn:string; exampleSentence:string; difficulty:CartoonLevel; position:number;
  added:boolean; masteryLevel:number;
};
export type CartoonProgress = { added:number; learned:number; total:number };
export type CartoonLessonSummary = {
  id:string; slug:string; title:string; level:CartoonLevel; durationSeconds:number;
  description:string; coverEmoji:string; coverColor:string; youtubeVideoId:string|null; youtubeTitle:string|null; wordCount:number; sceneCount:number;
};
export type CartoonLessonDetail = CartoonLessonSummary & { scenes:CartoonScene[]; words:CartoonWord[]; progress:CartoonProgress };
export type AddCartoonWordResult = { added:boolean; wordId:string; message:string; progress:CartoonProgress };
export function cartoonDuration(seconds:number):string {
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
export function cartoonTokenKey(value:string):string {
  return value.toLocaleLowerCase().replace(/[‘’]/g, "'").replace(/^[^a-z'-]+|[^a-z'-]+$/g,'');
}
