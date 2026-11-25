'use client';

import { useRef, useState } from 'react';
import { Check, Languages, Plus, RotateCcw } from 'lucide-react';
import { useLibrary } from '@/features/library-context';
import { captionSpans } from '@/lib/caption-terms';
import type { CartoonScene, CartoonWord } from '@/lib/cartoons';
import type { TranslationContext } from '@/lib/context-translation';
import { api } from '@/lib/client';

type Translation = {
  cacheKey: string;
  expression: string;
  expressionStart: number;
  expressionEnd: number;
  translation: string;
  sourceText: string;
  lineTranslation: string;
  definitionEn: string;
  targetLanguage: 'ru' | 'kk';
};
type Selection = { request: TranslationContext; translation: Translation | null };

export function CartoonContextPractice({ slug, scenes, sceneIndex, words, showTranslation, onSaved }: {
  slug: string; scenes: CartoonScene[]; sceneIndex: number; words: CartoonWord[]; showTranslation: boolean; onSaved: () => Promise<void>;
}) {
  const { user } = useLibrary();
  const scene = scenes[sceneIndex];
  const [selected, setSelected] = useState<Selection | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const latestRequest = useRef(0);
  const phrases = words.map((word) => word.word).filter((word) => word.includes(' '));
  if (selected?.translation?.expression.includes(' ')) phrases.push(selected.translation.expression);

  async function lookup(request: TranslationContext) {
    const requestNumber = ++latestRequest.current;
    setSelected({ request, translation: null }); setBusy(true); setError(''); setMessage('');
    try {
      const translation = await api<Translation>('/ai/context-translation', 'POST', request);
      if (requestNumber === latestRequest.current) setSelected({ request, translation });
    } catch (cause) { if (requestNumber === latestRequest.current) setError(cause instanceof Error ? cause.message : 'Could not translate this line.'); }
    finally { if (requestNumber === latestRequest.current) setBusy(false); }
  }

  async function save() {
    const translation = selected?.translation;
    if (!translation || saving) return;
    setSaving(true); setMessage('');
    try {
      const result = await api<{ added: boolean }>('/cartoons/context-word', 'POST', { cacheKey: translation.cacheKey });
      setSavedKeys((current) => [...current, translation.cacheKey]);
      setMessage(result.added ? 'Added with this line as the example.' : 'This contextual meaning is already in your vocabulary.');
      await onSaved();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not save this meaning.'); }
    finally { setSaving(false); }
  }

  return <>
    <div className="cartoon-subtitles"><p>{captionSpans(scene.subtitleEn, phrases).map((part, index) => {
      if (!part.term) return <span key={index}>{part.text}</span>;
      const translation = selected?.translation;
      const active = translation && part.start === translation.expressionStart && part.end === translation.expressionEnd;
      return <button key={index} className={`cartoon-subtitle-word${active ? ' contextual-expression' : ''}`} onClick={() => {
        const request: TranslationContext = { videoId: `practice:${slug}`, cueIndex: sceneIndex, selectedStart: part.start, selectedEnd: part.end, selectedText: scene.subtitleEn.slice(part.start, part.end), currentText: scene.subtitleEn, previousText: scenes[sceneIndex - 1]?.subtitleEn ?? null, nextText: scenes[sceneIndex + 1]?.subtitleEn ?? null, sourceLanguage: 'en', targetLanguage: user.language_preference === 'kk' ? 'kk' : 'ru' };
        void lookup(request);
      }}>{part.text}{active ? ` (${translation.translation})` : ''}</button>;
    })}</p>{showTranslation && <div className="cartoon-translation"><Languages size={16} /><span>{scene.translation}</span></div>}</div>
    {selected && <section className="cartoon-context-card" aria-live="polite"><div className="cartoon-context-heading"><span className="eyebrow">MEANING IN THIS LINE · EN → {selected.request.targetLanguage.toUpperCase()}</span><strong>{selected.translation?.expression ?? selected.request.selectedText}</strong></div>
      {busy ? <p className="muted">Checking the meaning in this line…</p> : selected.translation ? <><div className="cartoon-context-meaning">{selected.translation.translation}</div>{selected.translation.expression !== selected.request.selectedText && <p className="cartoon-context-tip">Save the whole expression “{selected.translation.expression}”.</p>}<div className="cartoon-context-lines"><p><small>ORIGINAL LINE</small>{selected.translation.sourceText}</p><p><small>LINE TRANSLATION</small>{selected.translation.lineTranslation}</p></div><button className="button button-primary" disabled={saving || savedKeys.includes(selected.translation.cacheKey)} onClick={() => void save()}>{savedKeys.includes(selected.translation.cacheKey) ? <><Check size={16} /> In your vocabulary</> : <><Plus size={16} /> {saving ? 'Adding…' : 'Add to vocabulary'}</>}</button></> : <p className="muted">Tap retry to check this word in context.</p>}
      {error && <div className="cartoon-context-error" role="alert"><span>{error}</span><button className="button button-outline" onClick={() => void lookup(selected.request)}><RotateCcw size={15} /> Retry</button></div>}
    </section>}
    {message && <p className="cartoon-message" role="status">{message}</p>}
  </>;
}
