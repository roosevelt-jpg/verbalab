import type { ContentFormat, FormatPlan } from './format-types';
import { planHtml, planXml } from './html-xml.codec';
import { planMarkdown } from './markdown.codec';
import { planCsv } from './csv.codec';
import { planSrt } from './srt.codec';

export function planContent(format: ContentFormat, content: string): FormatPlan {
  switch (format) {
    case 'html':
      return planHtml(content);
    case 'xml':
      return planXml(content);
    case 'markdown':
      return planMarkdown(content);
    case 'csv':
      return planCsv(content);
    case 'srt':
      return planSrt(content);
    case 'plain':
      return {
        format: 'plain',
        skeleton: '__VLT0__',
        segments: [{ index: 0, text: content }],
      };
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export function splitForStreaming(text: string, maxChars = 400): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim;
  if (!normalized) return [];
  if ([...normalized].length <= maxChars) return [normalized];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';

  const flush =  => {
    if (buf.trim) chunks.push(buf.trim);
    buf = '';
  };

  for (const para of paragraphs) {
    if ([...(buf ? `${buf}\n\n${para}` : para)].length <= maxChars) {
      buf = buf ? `${buf}\n\n${para}` : para;
      continue;
    }
    flush;
    if ([...para].length <= maxChars) {
      buf = para;
      continue;
    }
    const sentences = para.split(/(?<=[.!?。！？])\s+/);
    for (const sentence of sentences) {
      if ([...(buf ? `${buf} ${sentence}` : sentence)].length <= maxChars) {
        buf = buf ? `${buf} ${sentence}` : sentence;
      } else {
        flush;
        if ([...sentence].length <= maxChars) {
          buf = sentence;
        } else {
          // Hard split long runs
          const chars = [...sentence];
          for (let i = 0; i < chars.length; i += maxChars) {
            chunks.push(chars.slice(i, i + maxChars).join(''));
          }
        }
      }
    }
  }
  flush;
  return chunks.length ? chunks : [normalized];
}
