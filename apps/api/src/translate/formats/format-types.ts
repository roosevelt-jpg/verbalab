export type ContentFormat =
  | 'html'
  | 'markdown'
  | 'xml'
  | 'csv'
  | 'srt'
  | 'plain';

export type FormatSegment = {
  index: number;
  text: string;
};

export type FormatPlan = {
  format: ContentFormat;
  /** Template with __VLTn__ placeholders for translatable segments */
  skeleton: string;
  segments: FormatSegment[];
  note?: string;
};

export function restoreFormat(plan: FormatPlan, translations: string[]): string {
  let out = plan.skeleton;
  for (let i = 0; i < plan.segments.length; i++) {
    const translated = translations[i] ?? plan.segments[i]!.text;
    out = out.split(`__VLT${i}__`).join(translated);
  }
  return out;
}
