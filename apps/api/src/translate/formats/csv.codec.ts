import type { FormatPlan } from './format-types';

/** Minimal CSV parser (quoted fields, commas). Translates non-empty cells. */
export function planCsv(csv: string): FormatPlan {
  const rows = parseCsv(csv);
  const segments: FormatPlan['segments'] = [];
  const skeletonRows = rows.map((cells) =>
    cells.map((cell) => {
      if (!/\S/.test(cell)) return cell;
      const index = segments.length;
      segments.push({ index, text: cell });
      return `__VLT${index}__`;
    }),
  );

  const skeleton = skeletonRows.map((cells) => cells.map(escapeCsv).join(',')).join('\n');

  return {
    format: 'csv',
    skeleton,
    segments,
    note: 'All non-empty cells translated. Not Excel/XLSX.',
  };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (ch === '\r') continue;
    field += ch;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '' || text.length > 0) rows.push(row);
  return rows;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value) || value.startsWith('__VLT')) {
    if (value.startsWith('__VLT') && value.endsWith('__') && !/[",\n\r]/.test(value)) {
      return value;
    }
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
