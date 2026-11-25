import type { ReviewEvent, ReviewState, Word } from './types';
import { deriveMasteryLevel } from './scheduler';
export function dayKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function streak(events: ReviewEvent[], now = new Date()): { current: number; longest: number } {
  const days = new Set(events.map((e) => dayKey(new Date(e.reviewed_at))));
  let longest = 0, chain = 0; const sorted = [...days].sort();
  for (let i=0;i<sorted.length;i++) { const prev = i ? new Date(`${sorted[i-1]}T12:00:00`) : null; const cur = new Date(`${sorted[i]}T12:00:00`); chain = prev && Math.round((cur.getTime()-prev.getTime())/86400000) === 1 ? chain+1 : 1; longest = Math.max(longest,chain); }
  const cursor = new Date(now); if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate()-1);
  let current = 0; while (days.has(dayKey(cursor))) { current++; cursor.setDate(cursor.getDate()-1); }
  return { current,longest };
}
export function summary(words: Word[], states: ReviewState[], events: ReviewEvent[], now = new Date()) {
  const active = words.filter((w) => !w.deleted_at); const ids = new Set(active.map((w) => w.id));
  const state = states.filter((s) => ids.has(s.word_id));
  return { total: active.length, due: state.filter((s) => s.next_review_at <= now.toISOString()).length, mastered: state.filter((s) => deriveMasteryLevel(s.repetitions,s.interval_days) === 3).length, reviewedToday: events.filter((e) => ids.has(e.word_id) && dayKey(new Date(e.reviewed_at)) === dayKey(now)).length, reviews: events.length, ...streak(events,now) };
}
