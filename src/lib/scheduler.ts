import type { Rating, ReviewState } from './types';

const DAY_MS = 86_400_000;
export function scheduleReview(state: ReviewState, rating: Rating, now: string): Pick<ReviewState, 'interval_days' | 'ease_factor' | 'repetitions' | 'last_reviewed_at' | 'next_review_at' | 'updated_at'> {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || !Number.isInteger(state.interval_days) || state.interval_days < 0 ||
      !Number.isInteger(state.repetitions) || state.repetitions < 0 ||
      !Number.isFinite(state.ease_factor) || state.ease_factor < 1.3 || state.ease_factor > 3) throw new Error('Review schedule is invalid.');
  if (!(['Again', 'Hard', 'Good', 'Easy'] as string[]).includes(rating)) throw new Error('Choose a valid review rating.');
  let interval_days: number;
  let ease_factor = state.ease_factor;
  let repetitions = state.repetitions + 1;
  if (rating === 'Again') {
    interval_days = 1;
    repetitions = 0;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === 'Hard') {
    interval_days = state.interval_days === 0 ? 1 : Math.max(state.interval_days + 1, Math.ceil(state.interval_days * 1.2));
    ease_factor = Math.max(1.3, ease_factor - 0.15);
  } else if (rating === 'Good') {
    interval_days = state.interval_days === 0 ? 3 : Math.max(state.interval_days + 1, Math.round(state.interval_days * ease_factor));
  } else {
    interval_days = state.interval_days === 0 ? 7 : Math.max(state.interval_days + 2, Math.round(state.interval_days * ease_factor * 1.3));
    ease_factor = Math.min(3, ease_factor + 0.15);
  }
  const next = new Date(time + interval_days * DAY_MS);
  if (!Number.isFinite(next.getTime())) throw new Error('Review interval is out of range.');
  return { interval_days, ease_factor, repetitions, last_reviewed_at: now, next_review_at: next.toISOString(), updated_at: now };
}
export function deriveMasteryLevel(repetitions: number, intervalDays: number): number {
  if (repetitions >= 5 && intervalDays >= 21) return 3;
  if (repetitions >= 3 && intervalDays >= 7) return 2;
  if (repetitions >= 1) return 1;
  return 0;
}
export const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Mastered'] as const;
export const masteryLabel = (level: number) => MASTERY_LABELS[Math.max(0, Math.min(3, level))];
