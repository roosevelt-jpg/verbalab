export const DATASET_LICENSE_TAGS = [
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc0-1.0',
  'university-mou',
  'proprietary',
  'custom',
] as const;

export type DatasetLicenseTag = (typeof DATASET_LICENSE_TAGS)[number];

export function isDatasetLicenseTag(value: string): value is DatasetLicenseTag {
  return (DATASET_LICENSE_TAGS as readonly string[]).includes(value);
}

export function datasetMaxBytes: number {
  const raw = Number(process.env.DATASET_MAX_BYTES ?? String(50 * 1024 * 1024));
  if (!Number.isFinite(raw) || raw < 1024) return 50 * 1024 * 1024;
  return Math.floor(raw);
}
