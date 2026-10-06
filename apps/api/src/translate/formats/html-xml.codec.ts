import type { FormatPlan } from './format-types';

/** Tag-preserving HTML: translate text nodes only; leave markup intact. */
export function planHtml(html: string): FormatPlan {
  const segments: FormatPlan['segments'] = [];
  const parts = html.split(/(<[^>]+>)/g);
  let inSkip = false;

  const skeleton = parts
    .map((part) => {
      if (!part) return part;
      if (part.startsWith('<')) {
        const lower = part.toLowerCase;
        if (/^<(script|style|code|pre)\b/.test(lower)) inSkip = true;
        if (/^<\/(script|style|code|pre)\s*>/.test(lower)) inSkip = false;
        return part;
      }
      if (inSkip || !/\S/.test(part)) return part;
      const index = segments.length;
      segments.push({ index, text: part });
      return `__VLT${index}__`;
    })
    .join('');

  return {
    format: 'html',
    skeleton,
    segments,
    note: 'Text nodes translated; tags/script/style/pre preserved. Not a full DOM crawler.',
  };
}

export function planXml(xml: string): FormatPlan {
  const plan = planHtml(xml);
  return {
    ...plan,
    format: 'xml',
    note: 'Element text translated; markup preserved. Not XLIFF/TMX specialized.',
  };
}
