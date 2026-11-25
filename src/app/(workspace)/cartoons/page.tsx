'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowRight, BookOpen, Play, Clapperboard as VideoIcon } from 'lucide-react';
import { api } from '@/lib/client';
import { CARTOON_LEVELS, type CartoonLessonSummary, type CartoonLevel } from '@/lib/cartoons';

export default function Cartoons() {
  const [level, setLevel] = useState<CartoonLevel>('A1');
  const [lessons, setLessons] = useState<CartoonLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ lessons: CartoonLessonSummary[] }>(`/cartoons?level=${level}`)
      .then(({ lessons }) => { if (active) { setLessons(lessons); setLoading(false); } })
      .catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not load cartoons.'); setLoading(false); } });
    return () => { active = false; };
  }, [level, attempt]);

  function chooseLevel(value: CartoonLevel) {
    if (value === level) return;
    setLevel(value);
    setLessons([]);
    setError('');
    setLoading(true);
  }

  return <div className="page-stack cartoon-catalog">
    <header className="cartoon-catalog-hero">
      <div>
        <span className="eyebrow">WATCH & LEARN</span>
        <h1>English through cartoons</h1>
        <p>Choose your level, watch a real cartoon, and keep useful words in your vocabulary.</p>
      </div>
      <div className="cartoon-catalog-hero-art" aria-hidden="true"><Play size={36} fill="currentColor" /></div>
    </header>

    <section className="cartoon-catalog-content" aria-label="Cartoons by level">
      <div className="cartoon-catalog-topline">
        <div><span className="eyebrow">YOUR WATCHLIST</span><h2>Pick a level</h2></div>
        <span className="cartoon-catalog-note"><VideoIcon size={16} /> Videos from YouTube</span>
      </div>
      <div className="cartoon-levels" role="group" aria-label="English level">
        {CARTOON_LEVELS.map((value) => <button key={value} type="button" aria-pressed={level === value} className={level === value ? 'selected' : ''} onClick={() => chooseLevel(value)}>{value}</button>)}
        <Link className="cartoon-custom-level" href="/cartoons/custom">Custom</Link>
      </div>

      {loading ? <div className="page-state">Loading {level} cartoons…</div>
        : error ? <div className="page-state"><p>{error}</p><button className="button button-primary" onClick={() => { setLoading(true); setError(''); setAttempt((value) => value + 1); }}>Try again</button></div>
          : lessons.length ? <div className="cartoon-catalog-grid">{lessons.map((lesson) => <Link key={lesson.id} href={`/cartoons/${lesson.slug}`} className="cartoon-video-card">
            <div className="cartoon-video-card-poster" style={{ '--poster-color': lesson.coverColor } as CSSProperties}>
              {lesson.youtubeVideoId ? <span className="cartoon-video-card-thumbnail" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg)` }} /> : <span className="cartoon-mini-poster" aria-hidden="true"><span>{lesson.coverEmoji}</span></span>}
              <span className="cartoon-video-card-play"><Play size={22} fill="currentColor" /></span>
              <span className="cartoon-video-card-level">{lesson.level}</span>
            </div>
            <div className="cartoon-video-card-body">
              <div><span className="eyebrow">CARTOON LESSON</span><h3>{lesson.youtubeTitle || lesson.title}</h3><p>{lesson.wordCount} useful words to explore</p></div>
              <span className="cartoon-video-card-action">Watch & learn <ArrowRight size={18} /></span>
            </div>
          </Link>)}</div>
            : <div className="empty-state"><BookOpen size={32} /><h3>No videos at {level} yet</h3><p>Choose another level to keep learning.</p></div>}
    </section>
  </div>;
}
