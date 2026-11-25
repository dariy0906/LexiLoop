'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { ArrowRight,Flame,Swords,Target,Zap } from 'lucide-react';
import { api } from '@/lib/client';
import { LearningPath,type PathUnlocks } from './LearningPath';
type Game={totalXp:number;level:{level:number;current:number;next:number;progress:number};currentStreak:number;wordly:{completed:boolean;failed:boolean}|null;unlocks:PathUnlocks};
export function GameStrip(){
  const [game,setGame]=useState<Game|null>(null);
  useEffect(()=>{void api<Game>('/gamification/overview').then(setGame).catch(()=>undefined);},[]);
  if(!game)return null;
  return <><section className="panel home-game-strip"><div className="home-game-progress"><span><Zap/> Level {game.level.level}</span><strong>{game.totalXp} XP</strong><div className="progress-track"><div style={{width:String(game.level.progress*100)+'%'}}/></div></div><div className="home-game-stat"><Flame/><span><strong>{game.currentStreak}</strong> lesson streak</span></div><div className="home-game-actions">{game.unlocks.wordly?<Link href="/play/wordly"><Target/><span>Daily Wordly<small>{game.wordly?.completed?'Completed':game.wordly?.failed?'Try tomorrow':'Ready'}</small></span></Link>:<span className="home-game-locked"><Target/><span>Daily Wordly<small>Locked · 5 lessons + 10 words</small></span></span>}<Link href="/play/lessons"><Zap/><span>Quick Lesson<small>2–5 minutes</small></span></Link>{game.unlocks.arena?<Link href="/play/arena"><Swords/><span>Battle Arena<small>Adaptive BOT</small></span></Link>:<span className="home-game-locked"><Swords/><span>Battle Arena<small>Locked · level 20 + 25 words</small></span></span>}<Link href="/play" className="game-more">Play <ArrowRight/></Link></div></section><LearningPath gates={game.unlocks}/></>;
}
