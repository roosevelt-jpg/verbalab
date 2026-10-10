/** Browser-local LugemiCreative assets library (files + brand kits). */

export type CreativeAssetKind = 'folder' | 'file' | 'brand-kit';

export type CreativeAsset = {
  id: string;
  name: string;
  kind: CreativeAssetKind;
  mimeType?: string;
  sizeBytes?: number;
  parentId: string | null;
  createdAt: string;
  /** Object URL or data URL for previews (session-local). */
  previewUrl?: string;
  notes?: string;
};

const STORAGE_KEY = 'lugemi.creative.assets.v1';

function uid() {
  return `ca_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadCreativeAssets(): CreativeAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSeed();
    const parsed = JSON.parse(raw) as CreativeAsset[];
    return Array.isArray(parsed) ? parsed : defaultSeed();
  } catch {
    return defaultSeed();
  }
}

function defaultSeed(): CreativeAsset[] {
  return [
    {
      id: 'folder_avatars',
      name: 'My Avatars',
      kind: 'folder',
      parentId: null,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function saveCreativeAssets(rows: CreativeAsset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* quota */
  }
}

export function createFolder(name: string, parentId: string | null = null): CreativeAsset {
  const rows = loadCreativeAssets();
  const folder: CreativeAsset = {
    id: uid(),
    name: name.trim() || 'Untitled folder',
    kind: 'folder',
    parentId,
    createdAt: new Date().toISOString(),
  };
  rows.unshift(folder);
  saveCreativeAssets(rows);
  return folder;
}

export function createBrandKit(name: string): CreativeAsset {
  const rows = loadCreativeAssets();
  const kit: CreativeAsset = {
    id: uid(),
    name: name.trim() || 'Brand kit',
    kind: 'brand-kit',
    parentId: null,
    createdAt: new Date().toISOString(),
    notes: 'Colors, logos, and voice prefs for LugemiCreative projects.',
  };
  rows.unshift(kit);
  saveCreativeAssets(rows);
  return kit;
}

export async function uploadCreativeFile(file: File, parentId: string | null = null): Promise<CreativeAsset> {
  const rows = loadCreativeAssets();
  let previewUrl: string | undefined;
  try {
    previewUrl = URL.createObjectURL(file);
  } catch {
    previewUrl = undefined;
  }
  const asset: CreativeAsset = {
    id: uid(),
    name: file.name,
    kind: 'file',
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    parentId,
    createdAt: new Date().toISOString(),
    previewUrl,
  };
  rows.unshift(asset);
  saveCreativeAssets(rows);
  return asset;
}

export function formatBytes(n?: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function typeLabel(a: CreativeAsset): string {
  if (a.kind === 'folder') return 'Folder';
  if (a.kind === 'brand-kit') return 'Brand kit';
  if (a.mimeType?.startsWith('audio/')) return 'Audio';
  if (a.mimeType?.startsWith('image/')) return 'Image';
  if (a.mimeType?.startsWith('video/')) return 'Video';
  return 'File';
}
