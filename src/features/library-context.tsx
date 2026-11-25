'use client';
import { createContext,useCallback,useContext,useEffect,useRef,useState, type ReactNode } from 'react';
import { api } from '@/lib/client';
import type { Word,Category,ReviewState,ReviewEvent,SpeakingAttempt } from '@/lib/types';
import type { SessionUser } from '@/lib/session';
export type PracticeAttempt={id:string;word_id:string;mode:'quiz'|'sentence'|'writing';answer:string;correct:boolean|null;created_at:string};
type Library={ user:SessionUser; words:Word[]; categories:Category[]; states:ReviewState[]; events:ReviewEvent[]; practice:PracticeAttempt[]; speaking:SpeakingAttempt[]; loading:boolean; error:string|null; refresh:()=>Promise<void>; setUser:(user:SessionUser)=>void };
const Context=createContext<Library|null>(null);
export function LibraryProvider({user:initial,children}:{user:SessionUser;children:ReactNode}) {
  const [user,setUser]=useState(initial), [words,setWords]=useState<Word[]>([]),[categories,setCategories]=useState<Category[]>([]),[states,setStates]=useState<ReviewState[]>([]),[events,setEvents]=useState<ReviewEvent[]>([]),[practice,setPractice]=useState<PracticeAttempt[]>([]),[speaking,setSpeaking]=useState<SpeakingAttempt[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const loaded=useRef(false),requestId=useRef(0);
  const refresh=useCallback(async()=>{const id=++requestId.current;if(!loaded.current)setLoading(true);setError(null);try{const data=await api<Omit<Library,'loading'|'error'|'refresh'|'setUser'>>('/library');if(id!==requestId.current)return;setUser(data.user);setWords(data.words);setCategories(data.categories);setStates(data.states);setEvents(data.events);setPractice(data.practice);setSpeaking(data.speaking);loaded.current=true;}catch(cause){if(id!==requestId.current)return;setError(cause instanceof Error?cause.message:'Could not load your notebook.');}finally{if(id===requestId.current)setLoading(false);}},[]);
  useEffect(()=>{void Promise.resolve().then(refresh);},[refresh]);
  return <Context.Provider value={{user,words,categories,states,events,practice,speaking,loading,error,refresh,setUser}}>{children}</Context.Provider>;
}
export function useLibrary(){const value=useContext(Context);if(!value)throw new Error('LibraryProvider missing');return value;}
