export const WORDLY_LESSONS = 5;
export const WORDLY_WORDS = 10;
export const ARENA_LEVEL = 20;
export const ARENA_WORDS = 25;

export type UnlockProgress = { completedLessons: number; vocabularyWords: number; level: number };
export type UnlockGrants = { wordly: boolean; arena: boolean };

export function unlocks(progress: UnlockProgress, grants: UnlockGrants = { wordly: false, arena: false }) {
  return {
    progress,
    wordly: grants.wordly || (progress.completedLessons >= WORDLY_LESSONS && progress.vocabularyWords >= WORDLY_WORDS),
    arena: grants.arena || (progress.level >= ARENA_LEVEL && progress.vocabularyWords >= ARENA_WORDS),
  };
}
