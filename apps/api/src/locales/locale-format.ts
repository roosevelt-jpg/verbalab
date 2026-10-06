/** Thin Intl wrappers driven by locale pack BCP-47 / currency / timezone hints. */

export function formatLocaleDate(
  isoOrDate: string | Date,
  bcp47: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return new Intl.DateTimeFormat(bcp47, options ?? { dateStyle: 'long' }).format(date);
}

export function formatLocaleNumber(
  value: number,
  bcp47: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(bcp47, options).format(value);
}

export function formatLocaleCurrency(
  value: number,
  bcp47: string,
  currencyCode: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency: currencyCode,
    ...options,
  }).format(value);
}

export function formatLocaleDateTime(
  isoOrDate: string | Date,
  bcp47: string,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return new Intl.DateTimeFormat(bcp47, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(timeZone ? { timeZone } : {}),
    ...options,
  }).format(date);
}
