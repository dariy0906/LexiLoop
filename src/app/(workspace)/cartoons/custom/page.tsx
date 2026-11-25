'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Link2 } from 'lucide-react';
import { CustomCartoonCaptions } from '@/components/custom-cartoon-captions';
import { YouTubeCaptionPlayer } from '@/components/youtube-caption-player';

function youtubeVideoId(input: string) {
  try {
    const url = new URL(input.trim());
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null;
    if (url.hostname.endsWith('youtube.com')) return url.searchParams.get('v')?.match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null;
  } catch { /* validation message below */ }
  return null;
}

export default function CustomCartoon() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [time, setTime] = useState(0);
  const [replay, setReplay] = useState(0);

  function openVideo(event: React.FormEvent) {
    event.preventDefault();
    const id = youtubeVideoId(url);
    if (!id) { setVideoId(null); setMessage('Paste a full public YouTube video link.'); return; }
    setVideoId(id);
    setTime(0);
    setReplay((value) => value + 1);
    setMessage('');
  }

  return <div className="cartoon-custom-page page-stack">
    <Link href="/cartoons" className="back-link"><ArrowLeft size={17} /> Cartoons</Link>
    <section className="panel cartoon-custom-intro">
      <span className="eyebrow">YOUR VIDEO</span>
      <h1>Learn from a custom video</h1>
      <p>Paste a public YouTube link. LexiLoop imports an available English caption track so you can tap words for contextual translation.</p>
      <form onSubmit={openVideo} className="cartoon-custom-form">
        <label htmlFor="custom-video-url">YouTube video link</label>
        <div><Link2 size={18} /><input id="custom-video-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" autoComplete="url" /><button className="button button-primary" type="submit">Open video</button></div>
        {message && <p className="form-error" role="alert">{message}</p>}
      </form>
    </section>
    {videoId && <section className="panel cartoon-custom-player">
      <div className="cartoon-custom-embed"><YouTubeCaptionPlayer videoId={videoId} title="Custom YouTube video" replayTrigger={replay} onTime={setTime} /></div>
    </section>}
    {videoId && <CustomCartoonCaptions videoId={videoId} time={time} onReplay={() => setReplay((value) => value + 1)} />}
  </div>;
}
