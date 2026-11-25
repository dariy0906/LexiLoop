'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { ArrowRight,Clapperboard,Flame,Gauge,Sparkles,Swords,Target,Trophy,Zap } from 'lucide-react';
import { api } from '@/lib/client';
import { TimezoneField } from '@/components/TimezoneField';
import type { PathUnlocks } from '@/components/LearningPath';
type Overview={totalXp:number;level:{level:number;current:number;next:number;progress:number};currentStreak:number;longestStreak:number;skill:{rating:number;sampleSize:number;calibrating:boolean};wordly:{completed:boolean;failed:boolean;attempts:number}|null;unlocks:PathUnlocks};
export default function Play(){
  const [data,setData]=useState<Overview|null>(null),[error,setError]=useState('');
  useEffect(()=>{void api<Overview>('/gamification/overview').then(setData).catch((e)=>setError(e instanceof Error?e.message:'Could not load game progress.'));},[]);
  if(error)return <div className="page-state"><p>{error}</p></div>;
  if(!data)return <div className="page-state">Loading your play space…</div>;
  const levelXp=data.totalXp-data.level.current,nextXp=data.level.next-data.level.current;
  return <div className="page-stack">
    <section className="play-hero"><div><span className="eyebrow">LEARN. PLAY. GROW.</span><h1>Your words are ready to play.</h1><p>Short challenges built from your own vocabulary.</p></div><div className="level-medallion"><span>LEVEL</span><strong>{data.level.level}</strong></div></section>
    <div className="game-stats">
      <div><span className="game-stat-icon xp"><Zap/></span><strong>{data.totalXp} XP</strong><small>{levelXp} / {nextXp} to next level</small><div className="progress-track"><div style={{width:String(data.level.progress*100)+'%'}}/></div></div>
      <div><span className="game-stat-icon streak"><Flame/></span><strong>{data.currentStreak} day streak</strong><small>Best: {data.longestStreak} days</small></div>
      <div><span className="game-stat-icon skill"><Gauge/></span><strong>{data.skill.rating} Battle Skill</strong><small>{data.skill.calibrating?'Calibrating · '+data.skill.sampleSize+'/20 answers':'Rating established'}</small></div>
    </div>
    <div className="game-mode-grid">
      <div className={`game-mode-card wordly-card${data.unlocks.wordly?'':' mode-locked'}`}><span className="game-art"><Target/></span><span className="eyebrow">ONE WORD · ONCE A DAY</span><h2>Daily Wordly</h2><p>Unlock clues and recall today’s word from your own notebook.</p><span className="game-status">{data.unlocks.wordly?<Link href="/play/wordly">{data.wordly?.completed?'Completed today ✓':data.wordly?.failed?'Come back tomorrow':'Play Wordly'} <ArrowRight/></Link>:`Locked · ${Math.min(data.unlocks.progress.completedLessons,5)}/5 lessons · ${Math.min(data.unlocks.progress.vocabularyWords,10)}/10 words`}</span></div>
      <Link href="/play/lessons" className="game-mode-card lesson-card"><span className="game-art"><Sparkles/></span><span className="eyebrow">2–5 MINUTES</span><h2>Quick Lessons</h2><p>A smart mix of translation, definition, recall, and context.</p><span className="game-status">Start a lesson <ArrowRight/></span></Link>
      <div className={`game-mode-card arena-card${data.unlocks.arena?'':' mode-locked'}`}><span className="game-art"><Swords/></span><span className="eyebrow">3 ROUNDS · ADAPTIVE BOT</span><h2>Battle Arena</h2><p>Win the crowd with fast, accurate answers at your level.</p><span className="game-status">{data.unlocks.arena?<Link href="/play/arena">Enter the arena <ArrowRight/></Link>:`Locked · level ${data.unlocks.progress.level}/20 · ${Math.min(data.unlocks.progress.vocabularyWords,25)}/25 words`}</span></div>
      <Link href="/cartoons" className="game-mode-card cartoon-card"><span className="game-art"><Clapperboard/></span><span className="eyebrow">WATCH · LISTEN · LEARN</span><h2>Learn with Cartoons</h2><p>Short animated scenes, English subtitles, and a glossary from your level.</p><span className="game-status">Choose a cartoon <ArrowRight/></span></Link>
      <Link href="/practice" className="game-mode-card mistakes-card"><span className="game-art"><Trophy/></span><span className="eyebrow">FOCUSED PRACTICE</span><h2>Practice Mistakes</h2><p>Revisit difficult words without changing your review schedule.</p><span className="game-status">Practice now <ArrowRight/></span></Link>
    </div>
    <TimezoneField/>
  </div>;
}
