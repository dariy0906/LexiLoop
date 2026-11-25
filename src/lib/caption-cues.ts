export type CaptionCue = { start: number; end: number; text: string };

function seconds(value: string): number {
  const parts = value.replace(',', '.').split(':').map(Number);
  if (parts.some(Number.isNaN)) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);|&#(\d+);|&#x([0-9a-f]+);/gi, (_, named: string | undefined, decimal: string | undefined, hex: string | undefined) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    const names: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
    return names[named?.toLowerCase() ?? ''] ?? _;
  });
}

function cleanCaption(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/[[(](?:music|applause|laughter|cheering|inaudible|noise)[\])]/gi, ' ')
    .replace(/^\s*>+\s*/g, '')
    .replace(/\s+/g, ' ').trim();
}

function overlapWords(previous: string[], current: string[]): number {
  const max = Math.min(previous.length, current.length);
  for (let length = max; length >= 2; length -= 1) {
    if (previous.slice(-length).map((word) => word.toLowerCase()).join(' ') === current.slice(0, length).map((word) => word.toLowerCase()).join(' ')) return length;
  }
  return 0;
}

function coalesceCaptionCues(cues: CaptionCue[]): CaptionCue[] {
  const result: CaptionCue[] = [];
  for (const cue of cues) {
    const text = cleanCaption(cue.text);
    if (!text || (cue.start < 10 && /^(translator|reviewer):/i.test(text))) continue;
    const previous = result.at(-1);
    if (!previous) { result.push({ ...cue, text }); continue; }
    if (previous.text === text || previous.text.endsWith(text)) { previous.end = Math.max(previous.end, cue.end); continue; }
    const oldWords = previous.text.split(/\s+/), newWords = text.split(/\s+/);
    const overlap = overlapWords(oldWords, newWords);
    if (overlap && cue.start - previous.end < 2) {
      const extension = newWords.slice(overlap);
      if (extension.length) previous.text = previous.text + ' ' + extension.join(' ');
      previous.end = Math.max(previous.end, cue.end);
      continue;
    }
    result.push({ ...cue, text });
  }
  return result;
}

export function parseWebVtt(source: string): CaptionCue[] {
  const blocks = source.replace(/\r/g, '').split(/\n\s*\n/);
  const cues: CaptionCue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeIndex = lines.findIndex((line) => line.includes(' --> '));
    if (timeIndex < 0) continue;
    const [from, to] = lines[timeIndex].split(' --> ');
    const start = seconds(from.trim());
    const end = seconds(to.trim().split(/\s/)[0]);
    const text = lines.slice(timeIndex + 1).join(' ').trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) cues.push({ start, end, text });
  }
  return coalesceCaptionCues(cues.sort((a, b) => a.start - b.start));
}

export function captionAt(cues: CaptionCue[], time: number): CaptionCue | null {
  let low = 0; let high = cues.length - 1;
  while (low <= high) { const middle = (low + high) >>> 1; if (cues[middle].start <= time) low = middle + 1; else high = middle - 1; }
  const cue = cues[high];
  return cue && time < cue.end ? cue : null;
}