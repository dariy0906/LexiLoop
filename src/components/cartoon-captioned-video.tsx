'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, RefreshCw } from 'lucide-react';
import { useLibrary } from '@/features/library-context';
import { captionAt, parseWebVtt, type CaptionCue } from '@/lib/caption-cues';
import { captionSegments } from '@/lib/caption-terms';
import { type CartoonWord } from '@/lib/cartoons';
import { api } from '@/lib/client';
import { YouTubeCaptionPlayer } from './youtube-caption-player';

type Suggestion = {
  phonetic: string | null;
  definition_en: string;
  translation_ru: string;
  translation_kk: string;
  example_sentence: string;
};

export function CartoonCaptionedVideo({ videoId, title, words, onAddKnownWord }: {
  videoId: string;
  title: string;
  words: CartoonWord[];
  onAddKnownWord: (word: CartoonWord) => Promise<void>;
}) {
  const { refresh } = useLibrary();
  const [time, setTime] = useState(0);
  const [replay, setReplay] = useState(0);
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [captionError, setCaptionError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [lookingUp, setLookingUp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  const glossary = useMemo(() => new Map(words.map((word) => [word.word.toLocaleLowerCase(), word])), [words]);
  const phrases = useMemo(() => words.map((word) => word.word).filter((word) => word.includes(' ')), [words]);
  const cue = captionAt(cues, time);
  const knownWord = selected ? glossary.get(selected) : null;
  const suggestion = selected ? suggestions[selected] : null;
  const translation = knownWord?.translationRu || suggestion?.translation_ru;

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
      .catch((cause) => {
        if (!controller.signal.aborted) setCaptionError(cause instanceof Error ? cause.message : 'Could not load subtitles.');
      });
    return () => controller.abort();
  }, [videoId]);

  async function selectWord(word: string) {
    setSelected(word);
    setMessage('');
    if (glossary.has(word) || suggestions[word] || lookingUp === word) return;
    setLookingUp(word);
    try {
      const result = await api<Suggestion>('/ai/word-suggestion', 'POST', { word });
      setSuggestions((current) => ({ ...current, [word]: result }));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not translate this word.');
    } finally {
      setLookingUp('');
    }
  }

  async function saveWord() {
    if (!selected || !translation || saving) return;
    setSaving(true);
    setMessage('');
    try {
      if (knownWord) await onAddKnownWord(knownWord);
      else if (suggestion) {
        await api('/words', 'POST', {
          word: selected, phonetic: suggestion.phonetic, definition_en: suggestion.definition_en,
          translation_ru: suggestion.translation_ru, translation_kk: suggestion.translation_kk,
          example_sentence: suggestion.example_sentence, notes: null, category_id: null,
        });
        setSaved((current) => ({ ...current, [selected]: true }));
        await refresh();
        setMessage('Added to your vocabulary.');
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not save this word.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="cartoon-video-wrap"><YouTubeCaptionPlayer videoId={videoId} title={title} replayTrigger={replay} onTime={setTime} /></div>
    <div className="cartoon-video-actions"><span>English subtitles follow the video below.</span><button className="button button-quiet" onClick={() => setReplay((value) => value + 1)}><RefreshCw size={16} /> Replay video</button></div>
    <div className="cartoon-practice-head"><div><span className="eyebrow">SYNCHRONIZED SUBTITLES · ENGLISH</span><h2>Listen and tap a word</h2></div><span>{Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}</span></div>
    <div className="cartoon-subtitles cartoon-live-subtitles" aria-live="polite"><p>{captionError || (cue ? captionSegments(cue.text, phrases).map((part, index) => {
      const word = part.term;
      if (!word) return <span key={index}>{part.text}</span>;
      const inlineTranslation = selected === word ? glossary.get(word)?.translationRu || suggestions[word]?.translation_ru : null;
      return <button key={index} className="cartoon-subtitle-word" onClick={() => void selectWord(word)}>{part.text}{inlineTranslation ? ` (${inlineTranslation})` : selected === word && lookingUp === word ? ' (…)' : ''}</button>;
    }) : time < 0.25 ? 'Press play to start the subtitles.' : 'Waiting for the next spoken line…')}</p></div>
    {selected && <div className="cartoon-word-action"><strong>{selected} <span>{translation ? `(${translation})` : lookingUp === selected ? '(translating…)' : ''}</span></strong><button className="button button-primary" disabled={!translation || Boolean(knownWord?.added) || Boolean(saved[selected]) || saving} onClick={() => void saveWord()}>{knownWord?.added || saved[selected] ? <><Check size={16} /> In your vocabulary</> : <><Plus size={16} /> {saving ? 'Adding…' : 'Add to vocabulary'}</>}</button></div>}
    {message && <p className="cartoon-message" role="status">{message}</p>}
  </>;
}
