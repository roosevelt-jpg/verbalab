import type { FormatPlan } from './format-types';

/** Markdown with fenced/inline code preserved; body text segmented. */
export function planMarkdown(md: string): FormatPlan {
  const segments: FormatPlan['segments'] = [];
  const protectedBlocks: string[] = [];

  let working = md.replace(/```[\s\S]*?```/g, (block) => {
    const i = protectedBlocks.length;
    protectedBlocks.push(block);
    return `\n__VLB${i}__\n`;
  });

  working = working.replace(/`[^`\n]+`/g, (inline) => {
    const i = protectedBlocks.length;
    protectedBlocks.push(inline);
    return `__VLB${i}__`;
  });

  const lines = working.split(/(\n)/);
  const skeletonParts = lines.map((line) => {
    if (line === '\n') return line;
    if (!/\S/.test(line)) return line;
    if (/^__VLB\d+__$/.test(line.trim())) return line;

    const heading = line.match(/^(#{1,6}\s+)(.+)$/);
    if (heading) {
      const index = segments.length;
      segments.push({ index, text: heading[2]! });
      return `${heading[1]}__VLT${index}__`;
    }

    const list = line.match(/^([-*+]\s+|\d+\.\s+)(.+)$/);
    if (list) {
      const index = segments.length;
      segments.push({ index, text: list[2]! });
      return `${list[1]}__VLT${index}__`;
    }

    const index = segments.length;
    segments.push({ index, text: line });
    return `__VLT${index}__`;
  });

  let skeleton = skeletonParts.join('');
  for (let i = 0; i < protectedBlocks.length; i++) {
    skeleton = skeleton.split(`__VLB${i}__`).join(protectedBlocks[i]!);
  }

  return {
    format: 'markdown',
    skeleton,
    segments,
    note: 'Code fences/inline code preserved; headings/lists/paragraphs translated.',
  };
}
