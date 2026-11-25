'use client';
import { useState } from 'react';
import { Clock3,Save } from 'lucide-react';
import { useLibrary } from '@/features/library-context';
import { api } from '@/lib/client';
const COMMON=['UTC','Asia/Aqtau','Asia/Almaty','Asia/Astana','Europe/London','Europe/Berlin','America/New_York','America/Los_Angeles'];
export function TimezoneField(){
  const {user,refresh}=useLibrary();const detected=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [value,setValue]=useState(user.timezone||detected||'UTC'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const options=[...new Set([value,detected,...COMMON].filter(Boolean))];
  async function save(){setBusy(true);setMessage('');try{await api('/profile/timezone','PATCH',{timezone:value});await refresh();setMessage('Timezone saved. Daily games now follow this local day.');}catch(e){setMessage(e instanceof Error?e.message:'Could not save timezone.');}finally{setBusy(false);}}
  return <div className="panel form-panel"><div className="panel-heading"><div><h2>Local time</h2><p className="muted">Daily Wordly and lesson streaks reset at midnight in this timezone.</p></div><Clock3/></div><label className="field">Timezone<select value={value} onChange={(e)=>setValue(e.target.value)}>{options.map((zone)=><option key={zone} value={zone}>{zone}</option>)}</select></label>{message&&<p className={message.includes('saved')?'correct-text':'error-text'}>{message}</p>}<div className="form-actions"><button className="button button-primary" disabled={busy} onClick={()=>void save()}><Save size={16}/>{busy?'Saving…':'Save timezone'}</button></div></div>;
}
