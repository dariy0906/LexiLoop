import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized, failure, isResponse } from '@/lib/api';
import { pool } from '@/lib/db';

const schema = z.object({ cacheKey: z.string().regex(/^[a-f0-9]{64}$/) });
const resultSchema = z.object({
  expression: z.string().trim().min(1).max(120).regex(/^[A-Za-z][A-Za-z '’\-]*$/),
  translation: z.string().trim().min(1).max(300),
  targetLanguage: z.enum(['ru','kk']),
  sourceText: z.string().trim().min(1).max(1000),
  lineTranslation: z.string().trim().min(1).max(1000),
  definitionEn: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const user = await authorized();
  if (isResponse(user)) return user;
  const client = await pool().connect();
  try {
    const { cacheKey } = schema.parse(await request.json());
    const cached = (await client.query<{result:unknown}>('select result from cartoon_translation_cache where cache_key=$1',[cacheKey])).rows[0];
    if (!cached) return failure(new Error('Translation expired. Please translate the subtitle again.'),404);
    const value = resultSchema.parse(cached.result);
    if (value.targetLanguage !== (user.language_preference === 'kk' ? 'kk' : 'ru')) return failure(new Error('Translation language does not match your profile.'), 400);
    const normalizedWord = value.expression.replace(/[‘’]/g, "'");
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [`context:${user.id}:${normalizedWord.toLocaleLowerCase()}:${value.sourceText}:${value.translation}`]);
    const existing = (await client.query<{ id: string }>(`select id from vocabulary_words where user_id=$1 and deleted_at is null and lower(word)=lower($2)
      and example_sentence=$3 and ${value.targetLanguage === 'ru' ? 'translation_ru' : 'translation_kk'}=$4 limit 1`, [user.id, normalizedWord, value.sourceText, value.translation])).rows[0];
    if (existing) { await client.query('commit'); return NextResponse.json({ id: existing.id, added: false }); }
    const inserted = (await client.query<{ id: string }>(`insert into vocabulary_words(user_id,word,definition_en,translation_ru,translation_kk,example_sentence,notes)
      values($1,$2,$3,$4,$5,$6,$7) returning id`, [user.id, normalizedWord, value.definitionEn, value.targetLanguage === 'ru' ? value.translation : null, value.targetLanguage === 'kk' ? value.translation : null, value.sourceText, `Перевод реплики: ${value.lineTranslation}`])).rows[0];
    await client.query('insert into review_state(id,user_id,word_id) values($1,$2,$3)', [inserted.id, user.id, inserted.id]);
    await client.query('commit');
    return NextResponse.json({ id: inserted.id, added: true }, { status: 201 });
  } catch (error) { await client.query('rollback'); return failure(error); }
  finally { client.release(); }
}
