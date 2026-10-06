/** Shared ISO country helpers for Studio pickers. */

export type StudioCountryOption = {
  code: string;
  nameEn: string;
  region: string;
  currencyCode?: string;
};

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const AFRICAN_CODES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW',
]);

/** Build a full ISO region list via Intl when API is unavailable. */
export function buildIntlCountryOptions(): StudioCountryOption[] {
  const exclude = new Set(['ZZ', 'EU', 'EZ', 'UN', 'QO']);
  const rows: StudioCountryOption[] = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (exclude.has(code)) continue;
      let name: string | undefined;
      try {
        name = regionNames?.of(code) ?? undefined;
      } catch {
        name = undefined;
      }
      if (!name || name === code) continue;
      rows.push({
        code,
        nameEn: code === 'CI' ? "Côte d'Ivoire" : name,
        region: AFRICAN_CODES.has(code) ? 'Africa' : 'Worldwide',
      });
    }
  }
  return sortStudioCountries(rows);
}

export function sortStudioCountries<T extends { code: string; region?: string; nameEn?: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const aAf = (a.region ?? '').toLowerCase().includes('africa') || AFRICAN_CODES.has(a.code) ? 0 : 1;
    const bAf = (b.region ?? '').toLowerCase().includes('africa') || AFRICAN_CODES.has(b.code) ? 0 : 1;
    if (aAf !== bAf) return aAf - bAf;
    const r = (a.region ?? '').localeCompare(b.region ?? '');
    if (r !== 0) return r;
    return (a.nameEn ?? a.code).localeCompare(b.nameEn ?? b.code);
  });
}

export function formatCountryOptionLabel(c: StudioCountryOption): string {
  return `${c.nameEn} (${c.code})`;
}
