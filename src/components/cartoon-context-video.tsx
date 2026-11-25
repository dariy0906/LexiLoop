'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { useLibrary } from '@/features/library-context';
import { captionAt, parseWebVtt, type CaptionCue } from '@/lib/caption-cues';
import { captionSpans } from '@/lib/caption-terms';
import type { CartoonWord } from '@/lib/cartoons';
import type { TranslationContext } from '@/lib/context-translation';
import { api } from '@/lib/client';
import { YouTubeCaptionPlayer } from './youtube-caption-player';

type Translation = {
  expression: string;
  expressionStart: number;
  expressionEnd: number;
  translation: string;
  lineTranslation: string;
  definitionEn: string;
  sourceText: string;
  sourceLanguage: 'en';
  targetLanguage: 'ru' | 'kk';
  cached: boolean;
  cacheKey: string;
};
type Selection = { key: string; cueIndex: number; request: TranslationContext };

export function CartoonContextVideo({ videoId, title, words, onSaved }: { videoId: string; title: string; words: CartoonWord[]; onSaved: () => Promise<void> }) {
  const { user } = useLibrary();
  const targetLanguage = user.language_preference === 'kk' ? 'kk' : 'ru';
  const [time, setTime] = useState(0);
  const [replay, setReplay] = useState(0);
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [captionError, setCaptionError] = useState('');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [lookingUp, setLookingUp] = useState('');
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  const basePhrases = useMemo(() => words.map((word) => word.word).filter((word) => word.includes(' ')), [words]);
  const cue = captionAt(cues, time);
  const cueIndex = cue ? cues.indexOf(cue) : -1;
  const translation = selected ? translations[selected.key] : null;
  const activeTranslation = selected?.cueIndex === cueIndex ? translation : null;
  const phrases = activeTranslation?.expression.includes(' ') ? [...basePhrases, activeTranslation.expression] : basePhrases;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/captions/${videoId}.en.vtt`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Subtitles are unavailable for this video.');
        const parsed = parseWebVtt(await response.text());
        if (!parsed.length) throw new Error('The subtitle track is empty.');
        setCues(parsed);
        setCaptionError('');
      })
      .catch((cause) => { if (!controller.signal.aborted) setCaptionError(cause instanceof Error ? cause.message : 'Could not load subtitles.'); });
    return () => controller.abort();
  }, [videoId]);

  async function lookup(selection: Selection) {
    setSelected(selection);
    setMessage('');
    setLookupErrors((current) => ({ ...current, [selection.key]: '' }));
    if (translations[selection.key] || lookingUp === selection.key) return;
    setLookingUp(selection.key);
    try {
      const result = await api<Translation>('/ai/context-translation', 'POST', selection.request);
      setTranslations((current) => ({ ...current, [selection.key]: result }));
    } catch (cause) { setLookupErrors((current) => ({ ...current, [selection.key]: cause instanceof Error ? cause.message : 'Could not translate this line.' })); }
    finally { setLookingUp((current) => current === selection.key ? '' : current); }
  }

  function selectSegment(start: number, end: number) {
    if (!cue || cueIndex < 0) return;
    const request: TranslationContext = {
      videoId, cueIndex, selectedStart: start, selectedEnd: end,
      selectedText: cue.text.slice(start, end), currentText: cue.text,
      previousText: cues[cueIndex - 1]?.text ?? null, nextText: cues[cueIndex + 1]?.text ?? null,
      sourceLanguage: 'en', targetLanguage,
    };
    void lookup({ key: JSON.stringify(request), cueIndex, request });
  }

  async function saveWord() {
    if (!selected || !translation || saving) return;
    setSaving(true); setMessage('');
    try {
      const result = await api<{ id: string; added: boolean }>('/cartoons/context-word', 'POST', { cacheKey: translation.cacheKey });
      setSaved((current) => ({ ...current, [selected.key]: true }));
      setMessage(result.added ? 'Added to your vocabulary with this subtitle as the example.' : 'This contextual meaning is already in your vocabulary.');
      await onSaved();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not save this meaning.'); }
    finally { setSaving(false); }
  }

  return <>
    <div className="cartoon-video-wrap"><YouTubeCaptionPlayer videoId={videoId} title={title} replayTrigger={replay} onTime={setTime} /></div>
    <div className="cartoon-video-actions"><span>English subtitles follow the video below.</span><button className="button button-quiet" onClick={() => setReplay((value) => value + 1)}><RefreshCw size={16} /> Replay video</button></div>
    <div className="cartoon-practice-head"><div><span className="eyebrow">SYNCHRONIZED SUBTITLES · ENGLISH</span><h2>Listen and tap a word</h2></div><span>{Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}</span></div>
    <div className="cartoon-subtitles cartoon-live-subtitles" aria-live="polite"><p>{captionError || (cue ? captionSpans(cue.text, phrases).map((part, index) => {
      if (!part.term) return <span key={index}>{part.text}</span>;
      const active = activeTranslation && part.start === activeTranslation.expressionStart && part.end === activeTranslation.expressionEnd;
      return <button key={index} className={`cartoon-subtitle-word${active ? ' contextual-expression' : ''}`} onClick={() => selectSegment(part.start, part.end)}>{part.text}{active ? ` (${activeTranslation.translation})` : ''}</button>;
    }) : time < 0.25 ? 'Press play to start the subtitles.' : 'Waiting for the next spoken line…')}</p></div>
    {selected && <section className="cartoon-context-card" aria-live="polite">
      <div className="cartoon-context-heading"><span className="eyebrow">MEANING IN THIS SCENE · {selected.request.sourceLanguage.toUpperCase()} → {selected.request.targetLanguage.toUpperCase()}</span><strong>{translation?.expression ?? selected.request.selectedText}</strong></div>
      {lookingUp === selected.key ? <p className="muted">Checking the meaning in this subtitle…</p> : translation ? <>
        <div className="cartoon-context-meaning">{translation.translation}</div>
        {translation.expression !== selected.request.selectedText && <p className="cartoon-context-tip">This meaning belongs to the whole expression. Save “{translation.expression}” together.</p>}
        <div className="cartoon-context-lines"><p><small>ORIGINAL LINE</small>{translation.sourceText}</p><p><small>LINE TRANSLATION</small>{translation.lineTranslation}</p></div>
        <button className="button button-primary" onClick={() => void saveWord()} disabled={saving || Boolean(saved[selected.key])}>{saved[selected.key] ? <><Check size={16} /> In your vocabulary</> : <><Plus size={16} /> {saving ? 'Adding…' : 'Add to vocabulary'}</>}</button>
      </> : <p className="muted">Tap retry to translate this word with the surrounding lines.</p>}
      {lookupErrors[selected.key] && <div className="cartoon-context-error" role="alert"><span>{lookupErrors[selected.key]}</span><button className="button button-outline" onClick={() => void lookup(selected)}><RotateCcw size={15} /> Retry</button></div>}
    </section>}
    {message && <p className="cartoon-message" role="status">{message}</p>}
  </>;
}
