import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized, failure, isResponse, tooMany } from '@/lib/api';
import { parseWebVtt } from '@/lib/caption-cues';
import { loadYouTubeCaptions } from '@/lib/youtube-captions';
import { contextCacheKey, expressionSpan, translationMessages, type TranslationContext } from '@/lib/context-translation';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const inputSchema = z.object({
  videoId: z.string().regex(/^(?:[A-Za-z0-9_-]{11}|practice:[a-z0-9]+(?:-[a-z0-9]+)*|custom:[A-Za-z0-9_-]{11})$/),
  cueIndex: z.number().int().min(0),
  selectedStart: z.number().int().min(0),
  selectedEnd: z.number().int().min(1),
  selectedText: z.string().min(1).max(120),
  currentText: z.string().min(1).max(1000),
  previousText: z.string().max(1000).nullable(),
  nextText: z.string().max(1000).nullable(),
  sourceLanguage: z.literal('en'),
  targetLanguage: z.enum(['ru', 'kk']),
});
const resultSchema = z.object({
  expression: z.string().trim().min(1).max(120),
  translation: z.string().trim().min(1).max(300),
  line_translation: z.string().trim().min(1).max(1000),
  definition_en: z.string().trim().min(1).max(1000),
});
type Completion = { choices?: Array<{ message?: { content?: string | null } }> };

export async function POST(request: Request) {
  const user = await authorized();
  if (isResponse(user)) return user;
  try {
    const input = inputSchema.parse(await request.json());
    const expectedLanguage = user.language_preference === 'kk' ? 'kk' : 'ru';
    if (input.targetLanguage !== expectedLanguage) return failure(new Error('Translation language does not match your profile.'), 400);
    let lines: string[];
    if (input.videoId.startsWith('custom:')) {
      lines = (await loadYouTubeCaptions(input.videoId.slice('custom:'.length))).cues.map((cue) => cue.text);
    } else if (input.videoId.startsWith('practice:')) {
      const slug = input.videoId.slice('practice:'.length);
      const lesson = (await query<{ scenes: Array<{ subtitleEn: string }> }>('select scenes from cartoon_lessons where slug=$1', [slug]))[0];
      if (!lesson) return failure(new Error('Practice lines are unavailable.'), 404);
      lines = lesson.scenes.map((scene) => scene.subtitleEn);
    } else {
      const source = await readFile(join(process.cwd(), 'public', 'captions', `${input.videoId}.en.vtt`), 'utf8').catch(() => null);
      if (!source) return failure(new Error('Subtitles are unavailable for this video.'), 404);
      lines = parseWebVtt(source).map((cue) => cue.text);
    }
    const currentText = lines[input.cueIndex];
    if (!currentText || currentText !== input.currentText || (lines[input.cueIndex - 1] ?? null) !== input.previousText || (lines[input.cueIndex + 1] ?? null) !== input.nextText || currentText.slice(input.selectedStart, input.selectedEnd) !== input.selectedText) {
      return failure(new Error('The subtitle changed. Please tap the word again.'), 400);
    }
    const context: TranslationContext = input;
    const cacheKey = contextCacheKey(context);
    const cached = (await query<{ result: Record<string, unknown> }>('select result from cartoon_translation_cache where cache_key=$1', [cacheKey]))[0];
    if (cached) return NextResponse.json({ ...cached.result, cacheKey, cached: true });
    const limit = rateLimit(`context:${user.id}`, 60, 60 * 60 * 1000);
    if (!limit.allowed) return tooMany(limit.retryAfter);
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) return failure(new Error('Context translation is not configured yet.'), 503);
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', temperature: 0.1, max_tokens: 350, response_format: { type: 'json_object' }, messages: translationMessages(context) }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error('DeepSeek is unavailable. Please retry.');
    const content = ((await response.json()) as Completion).choices?.[0]?.message?.content;
    if (!content) throw new Error('DeepSeek returned an empty translation. Please retry.');
    const parsed = resultSchema.parse(JSON.parse(content));
    const span = expressionSpan(currentText, parsed.expression, input.selectedStart, input.selectedEnd);
    if (!span) throw new Error('The suggested expression did not match the subtitle. Please retry.');
    const result = { expression: currentText.slice(span.start, span.end), expressionStart: span.start, expressionEnd: span.end, translation: parsed.translation, lineTranslation: parsed.line_translation, definitionEn: parsed.definition_en, sourceText: currentText, sourceLanguage: 'en', targetLanguage: input.targetLanguage };
    await query('insert into cartoon_translation_cache(cache_key,result) values($1,$2) on conflict(cache_key) do nothing', [cacheKey, JSON.stringify(result)]);
    return NextResponse.json({ ...result, cacheKey, cached: false });
  } catch (error) {
    if (error instanceof z.ZodError) return failure(error);
    console.error('Context translation failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not translate this subtitle. Please retry.' }, { status: 502 });
  }
}
