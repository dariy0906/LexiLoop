import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parseWebVtt, type CaptionCue } from './caption-cues';

const run = promisify(execFile);
type LoadedCaptions = { title: string; cues: CaptionCue[] };
const captionCache = new Map<string, { expiresAt: number; value: LoadedCaptions }>();

/** Downloads only a public English subtitle track; never video or audio. */
export async function loadYouTubeCaptions(videoId: string): Promise<LoadedCaptions> {
  const cached = captionCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const directory = await mkdtemp(join(tmpdir(), 'lexiloop-caption-'));
  try {
    const output = join(directory, 'caption.%(ext)s');
    const modulePath = process.env.LEXILOOP_YTDLP_PATH || join(process.cwd(), 'vendor', 'yt-dlp');
    await run('python3', ['-m', 'yt_dlp', '--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'en', '--sub-format', 'vtt', '--no-playlist', '-o', output, `https://www.youtube.com/watch?v=${videoId}`], { timeout: 30_000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONPATH: modulePath } });
    const captionFile = (await readdir(directory)).find((name) => name.endsWith('.vtt'));
    if (!captionFile) throw new Error('This video has no English captions available.');
    const cues = parseWebVtt(await readFile(join(directory, captionFile), 'utf8'));
    if (!cues.length) throw new Error('This English subtitle track is empty.');
    const value = { title: 'Custom YouTube video', cues };
    captionCache.set(videoId, { expiresAt: Date.now() + 10 * 60_000, value });
    return value;
  } catch (error) {
    console.error('Custom caption import failed', error);
    throw new Error('English subtitles are not available for this video yet.');
  } finally { await rm(directory, { recursive: true, force: true }); }
}
