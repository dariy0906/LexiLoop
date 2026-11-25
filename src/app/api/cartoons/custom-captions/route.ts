import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized, failure, isResponse, tooMany } from '@/lib/api';
import { loadYouTubeCaptions } from '@/lib/youtube-captions';
import { rateLimit } from '@/lib/rate-limit';

const videoSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);

export async function GET(request: Request) {
  const user = await authorized();
  if (isResponse(user)) return user;
  try {
    const videoId = videoSchema.parse(new URL(request.url).searchParams.get('videoId'));
    const limit = rateLimit(`custom-captions:${user.id}`, 12, 60 * 60 * 1000);
    if (!limit.allowed) return tooMany(limit.retryAfter);
    const result = await loadYouTubeCaptions(videoId);
    return NextResponse.json({ videoId, ...result });
  } catch (error) { return failure(error, 422); }
}
