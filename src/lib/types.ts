export type Rating = 'Again' | 'Hard' | 'Good' | 'Easy';
export type Word = {
  id: string; user_id: string; word: string; phonetic: string | null;
  definition_en: string | null; translation_ru: string | null; translation_kk: string | null;
  example_sentence: string | null; notes: string | null; category_id: string | null;
  mastery_level: number; favorite?: boolean; created_at: string; updated_at: string; deleted_at: string | null;
};
export type Category = { id: string; user_id: string; name: string; created_at: string; updated_at: string; deleted_at: string | null };
export type ReviewState = { id: string; user_id: string; word_id: string; interval_days: number; ease_factor: number; repetitions: number; last_reviewed_at: string | null; next_review_at: string; created_at: string; updated_at: string };
export type ReviewEvent = { id: string; user_id: string; word_id: string; rating: Rating; reviewed_at: string; previous_interval_days: number | null; new_interval_days: number; created_at: string };
export type Profile = { id: string; display_name: string | null; daily_review_goal?: number; created_at: string };
export type ResearchPreference = { user_id: string; enabled: boolean; participant_code: string | null; updated_at: string };
export type SpeakingAttempt = { id: string; user_id: string; word_id: string; prompt_text: string; transcript_text: string; rubric_score: number; feedback_text: string; improved_example: string; created_at: string };
export type WordInput = Pick<Word, 'word' | 'phonetic' | 'definition_en' | 'translation_ru' | 'translation_kk' | 'example_sentence' | 'notes' | 'category_id'>;
