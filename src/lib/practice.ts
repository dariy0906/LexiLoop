import type { Word } from './types';
export type QuizQuestion = { word: Word; prompt: string; answer: string; options: string[] };
export function sentencePrompt(word: Word): string | null {
  const example = word.example_sentence?.trim();
  if (!example) return null;
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(example) ? example.replace(regex, '______') : null;
}
export function checkSentence(answer: string, target: string): boolean { return answer.trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase(); }
export function containsTargetWord(answer: string, target: string): boolean {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`,'i').test(answer);
}
export function checkPracticeAnswer(mode:'quiz'|'sentence'|'writing', answer:string, word:Word): boolean {
  if (mode === 'sentence') return checkSentence(answer, word.word);
  if (mode === 'writing') return containsTargetWord(answer, word.word);
  return [word.word, word.translation_ru, word.translation_kk, word.definition_en].some((value) => Boolean(value) && checkSentence(answer, value!));
}
export function makeQuiz(words: Word[], language: 'ru' | 'kk' | 'definition' = 'ru', limit = 10): QuizQuestion[] {
  const field = language === 'ru' ? 'translation_ru' : language === 'kk' ? 'translation_kk' : 'definition_en';
  const eligible = words.filter((w) => Boolean(w[field]?.trim()));
  if (eligible.length < 4 || (language !== 'definition' && new Set(eligible.map((w) => w[field]!.trim().toLocaleLowerCase())).size < 4)) return [];
  return [...eligible].sort(() => Math.random() - .5).slice(0,limit).map((word) => {
    const answer = word[field]!.trim();
    const distractors = [...new Set(eligible.filter((w) => w.id !== word.id).map((w) => w[field]!.trim()).filter((v) => v !== answer))].sort(() => Math.random() - .5).slice(0,3);
    return { word, prompt: language === 'definition' ? `Which word matches this definition? ${answer}` : `What does “${word.word}” mean?`, answer: language === 'definition' ? word.word : answer, options: (language === 'definition' ? [word.word,...eligible.filter((w) => w.id !== word.id).slice(0,3).map((w) => w.word)] : [answer,...distractors]).sort(() => Math.random() - .5) };
  });
}
