import type { FormatPlan } from './format-types';

/** SRT subtitle cues — timestamps preserved, cue text translated. */
export function planSrt(srt: string): FormatPlan {
  const segments: FormatPlan['segments'] = [];
  const blocks = srt.replace(/\r\n/g, '\n').split(/\n\n+/);

  const skeletonBlocks = blocks.map((block) => {
    const lines = block.split('\n');
    if (lines.length < 2) return block;
    const idxLine = lines[0] ?? '';
    const timeLine = lines[1] ?? '';
    if (!/^\d+$/.test(idxLine.trim) || !timeLine.includes('-->')) {
      return block;
    }
    const textLines = lines.slice(2);
    if (textLines.length === 0) return block;
    const joined = textLines.join('\n');
    if (!/\S/.test(joined)) return block;
    const index = segments.length;
    segments.push({ index, text: joined });
    return `${idxLine}\n${timeLine}\n__VLT${index}__`;
  });

  return {
    format: 'srt',
    skeleton: skeletonBlocks.join('\n\n'),
    segments,
    note: 'SRT cue text translated; indexes and timestamps preserved. Not WebVTT/ASS.',
  };
}
