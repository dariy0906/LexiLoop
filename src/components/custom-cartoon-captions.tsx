'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import { useLibrary } from '@/features/library-context';
import { captionAt, type CaptionCue } from '@/lib/caption-cues';
import { captionSpans } from '@/lib/caption-terms';
import type { TranslationContext } from '@/lib/context-translation';
import { api } from '@/lib/client';

type Translation = { expression: string; expressionStart: number; expressionEnd: number; translation: string; lineTranslation: string; cacheKey: string };
type Selection = { key: string; cueIndex: number; request: TranslationContext };

export function CustomCartoonCaptions({ videoId, time, onReplay }: { videoId: string; time: number; onReplay: () => void }) {
  const { user, refresh } = useLibrary();
  const targetLanguage = user.language_preference === 'kk' ? 'kk' : 'ru';
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [lookingUp, setLookingUp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const loadCaptions = useCallback(async () => {
    setState('loading'); setError('');
    try { const result = await api<{ cues: CaptionCue[] }>(`/cartoons/custom-captions?videoId=${videoId}`); setCues(result.cues); setState('ready'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load English subtitles.'); setState('error'); }
  }, [videoId]);
  useEffect(() => { const timer = window.setTimeout(() => { void loadCaptions(); }, 0); return () => window.clearTimeout(timer); }, [loadCaptions]);

  const cue = captionAt(cues, time);
  const cueIndex = cue ? cues.indexOf(cue) : -1;
  const translation = selected ? translations[selected.key] : null;
  const activeTranslation = selected?.cueIndex === cueIndex ? translation : null;
  const phrases = useMemo(() => activeTranslation?.expression.includes(' ') ? [activeTranslation.expression] : [], [activeTranslation]);

  async function lookup(selection: Selection) {
    setSelected(selection); if (translations[selection.key] || lookingUp === selection.key) return; setLookingUp(selection.key);
    try { const result = await api<Translation>('/ai/context-translation', 'POST', selection.request); setTranslations((current) => ({ ...current, [selection.key]: result })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not translate this subtitle.'); }
    finally { setLookingUp((current) => current === selection.key ? '' : current); }
  }
  function selectWord(start: number, end: number) {
    if (!cue || cueIndex < 0) return;
    const request: TranslationContext = { videoId: `custom:${videoId}`, cueIndex, selectedStart: start, selectedEnd: end, selectedText: cue.text.slice(start, end), currentText: cue.text, previousText: cues[cueIndex - 1]?.text ?? null, nextText: cues[cueIndex + 1]?.text ?? null, sourceLanguage: 'en', targetLanguage };
    void lookup({ key: JSON.stringify(request), cueIndex, request });
  }
  async function saveWord() {
    if (!selected || !translation || saving) return; setSaving(true);
    try { await api('/cartoons/context-word', 'POST', { cacheKey: translation.cacheKey }); setSaved((current) => ({ ...current, [selected.key]: true })); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add this word.'); } finally { setSaving(false); }
  }
  return <section className="panel custom-caption-panel">
    <div className="cartoon-video-actions"><span>English subtitles follow the video.</span><button className="button button-quiet" onClick={onReplay}><RefreshCw size={16} /> Replay video</button></div>
    <div className="cartoon-practice-head"><div><span className="eyebrow">SYNCHRONIZED SUBTITLES · ENGLISH</span><h2>Listen and tap a word</h2></div><span>{Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}</span></div>
    <div className="cartoon-subtitles cartoon-live-subtitles" aria-live="polite"><p>{state === 'loading' ? <><LoaderCircle className="spin" size={18} /> Loading subtitles…</> : state === 'error' ? <span className="custom-inline-error">{error} <button onClick={() => void loadCaptions()}>Retry</button></span> : cue ? captionSpans(cue.text, phrases).map((part, index) => { const active = activeTranslation && part.start === activeTranslation.expressionStart && part.end === activeTranslation.expressionEnd; return part.term ? <button key={index} className={`cartoon-subtitle-word${active ? ' contextual-expression' : ''}`} onClick={() => selectWord(part.start, part.end)}>{part.text}{active ? ` (${activeTranslation.translation})` : ''}</button> : <span key={index}>{part.text}</span>; }) : time < 0.25 ? 'Press play to start the subtitles.' : 'Waiting for the next spoken line…'}</p></div>
    {selected && <section className="cartoon-context-card" aria-live="polite"><div className="cartoon-context-heading"><span className="eyebrow">MEANING IN THIS LINE</span><strong>{translation?.expression ?? selected.request.selectedText}</strong></div>{lookingUp === selected.key ? <p className="muted">DeepSeek is checking the context…</p> : translation ? <><div className="cartoon-context-meaning">{translation.translation}</div><div className="cartoon-context-lines"><p><small>ORIGINAL LINE</small>{selected.request.currentText}</p><p><small>TRANSLATION</small>{translation.lineTranslation}</p></div><button className="button button-primary" onClick={() => void saveWord()} disabled={saving || Boolean(saved[selected.key])}>{saved[selected.key] ? <><Check size={16} /> In your vocabulary</> : <><Plus size={16} /> {saving ? 'Adding…' : 'Add to vocabulary'}</>}</button></> : <p className="muted">Choose another word or try again.</p>}</section>}
  </section>;
}