import type { CmsLink, CmsPageSection } from '@/data/cms-types';

/**
 * Serialize / parse CMS page sections for Admin textarea editing.
 * Preserves kind, steps, and links (not only title/body).
 *
 * Format per block (blank line between blocks):
 *   [kind] Title||Body
 *   > Step one
 *   > Step two
 *   @ Link label|/href
 */
export function serializeCmsSections(sections: CmsPageSection[]): string {
  return sections
    .map((s) => {
      const kind = s.kind && s.kind !== 'content' ? `[${s.kind}] ` : '';
      const head = `${kind}${s.title}||${s.body}`;
      const steps = (s.steps ?? []).map((step) => `> ${step}`);
      const links = (s.links ?? []).map((l) => `@ ${l.label}|${l.href}`);
      return [head, ...steps, ...links].join('\n');
    })
    .join('\n\n');
}

export function parseCmsSections(
  text: string,
  previous: CmsPageSection[] = [],
): CmsPageSection[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const head = lines[0] ?? 'Section||';
      const kindMatch = head.match(/^\[(content|guide|api)\]\s*/i);
      const kindRaw = kindMatch?.[1]?.toLowerCase() as CmsPageSection['kind'] | undefined;
      const restHead = kindMatch ? head.slice(kindMatch[0].length) : head;
      const parts = restHead.split('||');
      const title = (parts[0] ?? 'Section').trim() || 'Section';
      const body = parts.slice(1).join('||').trim();
      const steps: string[] = [];
      const links: CmsLink[] = [];
      for (const line of lines.slice(1)) {
        if (line.startsWith('>')) {
          const step = line.replace(/^>\s*/, '').trim();
          if (step) steps.push(step);
          continue;
        }
        if (line.startsWith('@')) {
          const raw = line.replace(/^@\s*/, '').trim();
          const pipe = raw.indexOf('|');
          if (pipe === -1) {
            if (raw) links.push({ label: raw, href: '#' });
          } else {
            const label = raw.slice(0, pipe).trim();
            const href = raw.slice(pipe + 1).trim();
            if (label && href) links.push({ label, href });
          }
        }
      }
      const prev = previous[i];
      const kind: CmsPageSection['kind'] =
        kindRaw ??
        (steps.length || links.length
          ? prev?.kind === 'api'
            ? 'api'
            : 'guide'
          : prev?.kind ?? 'content');
      const isKit = kind === 'guide' || kind === 'api';
      return {
        id: prev?.id ?? `section-${i + 1}`,
        title,
        body,
        media: prev?.media,
        kind,
        ...(isKit && (steps.length || prev?.steps)
          ? { steps: steps.length ? steps : prev?.steps }
          : {}),
        ...(isKit && (links.length || prev?.links)
          ? { links: links.length ? links : prev?.links }
          : {}),
      };
    });
}
