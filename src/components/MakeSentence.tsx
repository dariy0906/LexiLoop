'use client';

import { useState } from 'react';
import { ArrowRight, Check, PenLine, Sparkles } from 'lucide-react';
import { api } from '@/lib/client';
import type { Word } from '@/lib/types';

type Feedback = { score: number; correct: boolean; usesWord: boolean; feedbackRu: string; correctedSentence: string };

export function MakeSentence({ words, onBack, onSaved }: { words: Word[]; onBack: () => void; onSaved: () => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const word = words[index];

  function move(next: number) { setIndex(next); setSentence(''); setFeedback(null); setError(''); }
  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!word || busy) return;
    setBusy(true); setError(''); setFeedback(null);
    try {
      const result = await api<Feedback>('/ai/check-sentence', 'POST', { wordId: word.id, sentence: sentence.trim() });
      setFeedback(result);
      await onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not check your sentence.'); }
    finally { setBusy(false); }
  }

  return <div className="page-stack narrow-page make-sentence-page">
    <button className="back-link" onClick={onBack}>← Practice</button>
    <div className="page-heading"><span className="eyebrow">AI WRITING PRACTICE</span><h1>Make a sentence</h1><p>Write an English sentence using a word from your vocabulary. DeepSeek checks it and suggests a clearer version.</p></div>
    {!word ? <div className="review-center panel"><PenLine size={32} /><h2>Add a word first</h2><p>Your saved words will appear here.</p></div> : <section className="panel make-sentence-panel">
      <div className="make-sentence-top"><span className="eyebrow">WORD {index + 1} OF {words.length}</span><label className="field compact">Choose a word<select value={index} onChange={(event) => move(Number(event.target.value))}>{words.map((item, itemIndex) => <option key={item.id} value={itemIndex}>{item.word}</option>)}</select></label></div>
      <div className="make-sentence-word"><span className="make-sentence-icon"><PenLine /></span><div><strong>{word.word}</strong><small>{word.translation_ru || word.translation_kk || word.definition_en || 'Your vocabulary word'}</small></div></div>
      <form onSubmit={(event) => void check(event)}><label className="field">Your sentence<textarea rows={5} value={sentence} onChange={(event) => { setSentence(event.target.value); setFeedback(null); }} maxLength={500} minLength={8} placeholder={`Write a sentence with “${word.word}”…`} required /></label><div className="make-sentence-form-bottom"><small>Your sentence is sent to DeepSeek for feedback. {sentence.length}/500</small><button className="button button-primary" disabled={busy || sentence.trim().length < 8}>{busy ? 'Checking…' : <><Sparkles size={17} /> Check sentence</>}</button></div></form>
      {feedback && <div className={`make-sentence-feedback ${feedback.correct ? 'success' : 'revise'}`} role="status"><div><span>{feedback.correct ? <Check size={19} /> : <PenLine size={19} />}</span><strong>{feedback.correct ? 'Nice sentence!' : 'Try one more version'}</strong><b>{feedback.score}/100</b></div><p>{feedback.feedbackRu}</p>{feedback.correctedSentence !== sentence.trim() && <p className="make-sentence-correction"><small>Suggested version</small>{feedback.correctedSentence}</p>}</div>}
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="make-sentence-next"><button className="button button-outline" onClick={() => move((index + 1) % words.length)}>Next word <ArrowRight size={16} /></button></div>
    </section>}
  </div>;
}
