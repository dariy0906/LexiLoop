import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LexiLoop',
    short_name: 'LexiLoop',
    description: 'Your words, in motion.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7faf8',
    theme_color: '#0b8a7a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
