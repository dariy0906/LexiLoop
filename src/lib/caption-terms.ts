import { cartoonTokenKey } from './cartoons';

export type CaptionSegment = { text: string; term: string | null };

/** Keep the original spacing, but treat glossary phrases as one tappable term. */
export function captionSegments(text: string, phrases: string[]): CaptionSegment[] {
  const tokens = text.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*|\s+|[^A-Za-z\s]+/g) ?? [];
  const normalizedPhrases = phrases
    .map((phrase) => cartoonTokenKey(phrase))
    .filter((phrase) => phrase.includes(' '))
    .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length);
  const result: CaptionSegment[] = [];

  for (let index = 0; index < tokens.length;) {
    const token = tokens[index];
    const key = cartoonTokenKey(token);
    if (!key || !/^[A-Za-z]/.test(token)) {
      result.push({ text: token, term: null });
      index += 1;
      continue;
    }

    let matched: { text: string; term: string; length: number } | null = null;
    for (const phrase of normalizedPhrases) {
      const parts = phrase.split(/\s+/);
      let cursor = index;
      let fits = true;
      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        if (cartoonTokenKey(tokens[cursor] ?? '') !== parts[partIndex]) { fits = false; break; }
        if (partIndex < parts.length - 1) {
          if (!/^\s+$/.test(tokens[cursor + 1] ?? '')) { fits = false; break; }
          cursor += 2;
        }
      }
      if (fits) {
        matched = { text: tokens.slice(index, cursor + 1).join(''), term: phrase, length: cursor - index + 1 };
        break;
      }
    }
    if (matched) {
      result.push({ text: matched.text, term: matched.term });
      index += matched.length;
    } else {
      result.push({ text: token, term: key });
      index += 1;
    }
  }
  return result;
}

export function captionSpans(text: string, phrases: string[]): Array<CaptionSegment & { start: number; end: number }> {
  let offset = 0;
  return captionSegments(text, phrases).map((segment) => {
    const start = offset;
    offset += segment.text.length;
    return { ...segment, start, end: offset };
  });
}
