import { z } from 'zod';
import type { Word, WordInput } from './types';

export const englishTermSchema=z.string().trim().min(1).max(120).regex(/^[A-Za-z][A-Za-z '\-]*$/,'Use English letters only.');

export const wordSchema = z.object({
  word: englishTermSchema,
  phonetic: z.string().trim().max(120).nullable(),
  definition_en: z.string().trim().max(1000).nullable(),
  translation_ru: z.string().trim().max(300).nullable(),
  translation_kk: z.string().trim().max(300).nullable(),
  example_sentence: z.string().trim().max(1000).nullable(),
  notes: z.string().trim().max(2000).nullable(),
  category_id: z.string().uuid().nullable(),
});
export type Draft = { id: string; selected: boolean; word: string; translation_ru: string; error?: string };
export function parseBulk(input: string): Draft[] {
  return input.split(/\r?\n/).map((line, index) => {
    const [word, ...rest] = line.split(/\s[-–—]\s/);
    const trimmed = word?.trim() ?? '';
    return { id: String(index), selected: Boolean(trimmed), word: trimmed, translation_ru: rest.join(' - ').trim(), error: trimmed.length > 120 ? 'Word is too long' : undefined };
  }).filter((row) => row.word || row.translation_ru);
}
function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export const exportFields = ['word','phonetic','definition_en','translation_ru','translation_kk','example_sentence','notes','category'] as const;
export function exportCsv(words: Word[], categoryName: (id: string | null) => string): string {
  const rows = words.map((w) => [w.word,w.phonetic,w.definition_en,w.translation_ru,w.translation_kk,w.example_sentence,w.notes,categoryName(w.category_id)].map((v) => csvCell(v ?? '')).join(','));
  return '\uFEFF'+[exportFields.join(','), ...rows].join('\r\n');
}
export function parseCsv(input: string): { rows: Record<string,string>[]; errors: string[] } {
  input = input.replace(/^\uFEFF/,'');
  const lines: string[][] = []; let row: string[] = []; let field = ''; let quote = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') { if (quote && input[i+1] === '"') { field += '"'; i++; } else quote = !quote; }
    else if (ch === ',' && !quote) { row.push(field); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quote) { if (ch === '\r' && input[i+1] === '\n') i++; row.push(field); if (row.some(Boolean)) lines.push(row); row = []; field = ''; }
    else field += ch;
  }
  row.push(field); if (row.some(Boolean)) lines.push(row);
  if (quote) return { rows: [], errors: ['Unclosed quoted field.'] };
  const headers = lines.shift()?.map((v) => v.trim().toLowerCase()) ?? [];
  if (!headers.includes('word')) return { rows: [], errors: ['CSV needs a word column.'] };
  const errors: string[] = [];
  const rows = lines.map((values, index) => {
    if (values.length !== headers.length) errors.push(`Row ${index+2}: expected ${headers.length} columns.`);
    return Object.fromEntries(headers.map((h,i) => [h,values[i]?.trim() ?? '']));
  });
  return { rows, errors };
}
export function rowToWordInput(row: Record<string,string>, categoryId: string | null = null): WordInput {
  const nullable = (key: string) => row[key]?.trim() || null;
  return wordSchema.parse({ word: row.word ?? '', phonetic: nullable('phonetic'), definition_en: nullable('definition_en'), translation_ru: nullable('translation_ru'), translation_kk: nullable('translation_kk'), example_sentence: nullable('example_sentence') ?? nullable('example'), notes: nullable('notes'), category_id: categoryId });
}
