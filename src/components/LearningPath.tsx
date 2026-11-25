'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Gift, Lock, Swords, Target, Zap } from 'lucide-react';
import type { UnlockProgress } from '@/lib/unlocks';

export type PathUnlocks = { progress: UnlockProgress; wordly: boolean; arena: boolean };

export function LearningPath({ gates }: { gates: PathUnlocks }) {
  const { completedLessons, vocabularyWords, level } = gates.progress;
  const lessons = Math.min(completedLessons, 5);
  return <section className="learning-path panel" aria-label="Your learning path">
    <div className="learning-path-heading"><div><span className="eyebrow">YOUR LEARNING PATH</span><h2>One step at a time</h2><p>Complete lessons, collect words, and open the next challenge.</p></div><span className="path-level">Level {level}</span></div>
    <div className="path-track">
      {Array.from({ length: 5 }, (_, index) => {
        const done = completedLessons > index;
        const current = completedLessons === index;
        return <div className={`path-stop ${done ? 'done' : current ? 'current' : 'future'}`} key={index}>
          {done || current ? <Link href="/play/lessons" className="path-node" aria-label={`Quick Lesson ${index + 1}${done ? ' complete' : ''}`}><span>{done ? <Check /> : <BookOpen />}</span></Link> : <span className="path-node" aria-label={`Quick Lesson ${index + 1} locked`}><Lock /></span>}
          <div className="path-caption"><strong>Quick Lesson {index + 1}</strong><small>{done ? 'Completed' : current ? 'Ready to play' : 'Next step'}</small></div>
        </div>;
      })}
      <div className={`path-stop milestone ${gates.wordly ? 'done' : 'locked'}`}>
        {gates.wordly ? <Link href="/play/wordly" className="path-node" aria-label="Daily Wordly unlocked"><Gift /></Link> : <span className="path-node" aria-label="Daily Wordly locked"><Lock /></span>}
        <div className="path-caption"><strong>Daily Wordly</strong><small>{gates.wordly ? 'Unlocked — play today' : `${lessons}/5 lessons · ${Math.min(vocabularyWords, 10)}/10 words`}</small></div>
      </div>
      {[10, 15, 20].map((target) => <div className={`path-stop ${level >= target ? 'done' : 'future'}`} key={target}>
        <span className="path-node" aria-label={`Level ${target} milestone`}><Zap /></span>
        <div className="path-caption"><strong>Level {target}</strong><small>{level >= target ? 'Reached' : `${Math.max(0, target - level)} levels to go`}</small></div>
      </div>)}
      <div className={`path-stop milestone arena-milestone ${gates.arena ? 'done' : 'locked'}`}>
        {gates.arena ? <Link href="/play/arena" className="path-node" aria-label="Battle Arena unlocked"><Swords /></Link> : <span className="path-node" aria-label="Battle Arena locked"><Lock /></span>}
        <div className="path-caption"><strong>Battle Arena</strong><small>{gates.arena ? 'Unlocked — enter the arena' : `Level ${level}/20 · ${Math.min(vocabularyWords, 25)}/25 words`}</small></div>
      </div>
    </div>
    <div className="learning-path-footer"><span><Target size={16} /> {completedLessons} lessons complete · {vocabularyWords} saved words</span><Link href={completedLessons < 5 ? '/play/lessons' : '/play'}>Keep learning <ArrowRight size={16} /></Link></div>
  </section>;
}
