'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Clapperboard, Languages, Plus, Sparkles } from 'lucide-react';
import { api } from '@/lib/client';
import { useLibrary } from '@/features/library-context';
import { type AddCartoonWordResult, type CartoonLessonDetail, type CartoonWord } from '@/lib/cartoons';
import { CartoonContextVideo } from '@/components/cartoon-context-video';
import { CartoonContextPractice } from '@/components/cartoon-context-practice';

export default function CartoonLesson() {
  const { slug } = useParams<{ slug: string }>();
  return <CartoonLessonView key={slug} slug={slug} />;
}

function CartoonLessonView({ slug }: { slug: string }) {
  const { refresh } = useLibrary();
  const [lesson, setLesson] = useState<CartoonLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState('');

  useEffect(() => {
    let active = true;
    api<{ lesson: CartoonLessonDetail }>(`/cartoons/${encodeURIComponent(slug)}`)
      .then(({ lesson }) => { if (active) { setLesson(lesson); setLoading(false); } })
      .catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not load this cartoon.'); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);

  const unknownWords = (lesson?.words ?? []).filter((word) => !word.added);
  const scene = lesson?.scenes[sceneIndex];

  function moveScene(next: number) {
    if (!lesson) return;
    setSceneIndex(Math.max(0, Math.min(lesson.scenes.length - 1, next)));
    setShowTranslation(false);
  }

  async function reloadLesson() {
    const result = await api<{ lesson: CartoonLessonDetail }>(`/cartoons/${encodeURIComponent(slug)}`);
    setLesson(result.lesson);
    await refresh();
  }

  async function addWord(word: CartoonWord) {
    setAdding(word.id);
    setMessage('');
    try {
      const result = await api<AddCartoonWordResult>(`/cartoons/${encodeURIComponent(slug)}/words/${word.id}`, 'POST');
      setLesson((current) => current ? { ...current, progress: result.progress, words: current.words.map((item) => item.id === word.id ? { ...item, added: true } : item) } : current);
      setMessage(result.message);
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not add this word.');
    } finally {
      setAdding('');
    }
  }

  if (loading) return <div className="page-state">Preparing the cartoon…</div>;
  if (error) return <div className="review-center panel"><Clapperboard size={34} /><h1>Cartoon unavailable</h1><p>{error}</p><Link href="/cartoons" className="button button-primary">Back to cartoons</Link></div>;
  if (!lesson || !scene) return <div className="page-state">This cartoon has no practice lines yet. <Link href="/cartoons">Back to cartoons</Link></div>;

  const progress = lesson.progress;
  const addedPct = progress.total ? Math.round(progress.added / progress.total * 100) : 0;
  const learnedPct = progress.total ? Math.round(progress.learned / progress.total * 100) : 0;

  return <div className="cartoon-lesson-page">
    <Link href="/cartoons" className="back-link"><ArrowLeft size={17} /> Cartoons</Link>
    <div className="page-heading-row"><div className="page-heading"><span className="eyebrow">{lesson.level} · WATCH & LEARN</span><h1>{lesson.youtubeTitle || lesson.title}</h1><p>Watch the cartoon with synchronized English subtitles, then practice useful words.</p></div><div className="cartoon-heading-meta"><span className="mastery-pill">{lesson.level}</span><span><BookOpen size={16} /> {lesson.words.length} practice words</span></div></div>
    <div className="cartoon-lesson-grid">
      <section className="panel cartoon-watch-panel">
        {lesson.youtubeVideoId ? <CartoonContextVideo videoId={lesson.youtubeVideoId} title={lesson.youtubeTitle ?? lesson.title} words={lesson.words} onSaved={reloadLesson} /> : <div className="cartoon-stage" style={{ background: lesson.coverColor }}><span className="cartoon-stage-emoji">{scene.illustration}</span><span className="cartoon-stage-caption">{scene.title}</span></div>}
        <div className="cartoon-practice-head"><div><span className="eyebrow">EXTRA PRACTICE</span><h2>Practice useful words</h2></div><span>{sceneIndex + 1} / {lesson.scenes.length}</span></div>
        <CartoonContextPractice key={sceneIndex} slug={slug} scenes={lesson.scenes} sceneIndex={sceneIndex} words={lesson.words} showTranslation={showTranslation} onSaved={reloadLesson} />
        <div className="cartoon-controls"><button className="button button-outline" onClick={() => moveScene(sceneIndex - 1)} disabled={sceneIndex === 0}><ChevronLeft size={17} /> Previous line</button><button className="button button-quiet" onClick={() => setShowTranslation((value) => !value)}><Languages size={16} /> {showTranslation ? 'Hide translation' : 'Translate line'}</button><button className="button button-outline" onClick={() => moveScene(sceneIndex + 1)} disabled={sceneIndex === lesson.scenes.length - 1}>Next line <ChevronRight size={17} /></button></div>
        <section className="cartoon-unknown-words" aria-label="Your unknown words"><div><span className="eyebrow">YOUR PRACTICE WORDS</span><h2>Words to learn</h2><p className="muted">General glossary meanings (not checked against the current line). Tap a subtitle word for its contextual meaning.</p></div>{unknownWords.length ? <div className="cartoon-unknown-list">{unknownWords.map((word) => <div key={word.id} className="cartoon-unknown-item"><span><strong>{word.word}</strong><small>{word.translationRu}</small></span><button aria-label={`Add ${word.word} to vocabulary`} disabled={adding === word.id} onClick={() => void addWord(word)}><Plus size={16} /></button></div>)}</div> : <p className="cartoon-known-words"><Check size={16} /> You saved every practice word.</p>}</section>
        {message && <p className="cartoon-message" aria-live="polite">{message}</p>}
      </section>
      <aside className="panel cartoon-progress-panel"><span className="eyebrow">YOUR LESSON PROGRESS</span><h2>Small steps count</h2><p className="muted">Save words now, then review them in your notebook to build mastery.</p><div className="cartoon-progress-row"><div><span>Words saved</span><strong>{progress.added} / {progress.total}</strong></div><div className="progress-track"><div style={{ width: `${addedPct}%` }} /></div></div><div className="cartoon-progress-row"><div><span>Words studied</span><strong>{progress.learned} / {progress.total}</strong></div><div className="progress-track"><div style={{ width: `${learnedPct}%` }} /></div></div><div className="cartoon-progress-note"><Sparkles size={17} /><span>A word counts as studied after it has been reviewed at least once.</span></div><Link href="/review" className="text-link">Go to Review <ArrowRight size={16} /></Link></aside>
    </div>
  </div>;
}
