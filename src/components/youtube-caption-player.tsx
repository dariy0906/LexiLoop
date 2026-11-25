'use client';

import { useEffect, useRef, useState } from 'react';

type Player = {
  destroy(): void;
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
};
type YouTubeApi = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    host: string;
    playerVars: Record<string, string | number>;
    events: { onReady: () => void; onStateChange: () => void };
  }) => Player;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;
function loadApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error('YouTube player did not initialize.'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { apiPromise = null; reject(new Error('YouTube player could not load.')); };
    document.head.append(script);
  });
  return apiPromise;
}

export function YouTubeCaptionPlayer({ videoId, title, replayTrigger, onTime }: {
  videoId: string;
  title: string;
  replayTrigger: number;
  onTime: (seconds: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let ticker: ReturnType<typeof setInterval> | null = null;
    const mountPoint = container.current;
    if (!mountPoint) return;
    const readTime = () => {
      const current = player.current;
      if (active && current && typeof current.getCurrentTime === 'function') onTime(current.getCurrentTime());
    };
    loadApi().then((api) => {
      if (!active) return;
      player.current = new api.Player(mountPoint, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0, playsinline: 1, cc_load_policy: 1, cc_lang_pref: 'en', hl: 'en', origin: window.location.origin },
        events: {
          onReady: () => { if (active) onTime(0); },
          onStateChange: readTime,
        },
      });
      ticker = setInterval(readTime, 250);
    }).catch(() => { if (active) setFailed(true); });
    return () => {
      active = false;
      if (ticker) clearInterval(ticker);
      if (player.current && typeof player.current.destroy === 'function') player.current.destroy();
      player.current = null;
    };
  }, [videoId, onTime]);

  useEffect(() => {
    if (replayTrigger > 0 && player.current && typeof player.current.seekTo === 'function') {
      player.current.seekTo(0, true);
      player.current.playVideo();
      onTime(0);
    }
  }, [replayTrigger, onTime]);

  if (failed) return <iframe className="cartoon-video" src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&cc_load_policy=1&cc_lang_pref=en`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  return <div className="cartoon-video" ref={container} aria-label={title} />;
}
