/**
 * Convert a data: URL into a Blob so <audio>/<video> can play under CSP
 * media-src that allows blob: but not data:.
 */
export function blobFromDataUrl(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) {
    throw new Error('Invalid data URL');
  }
  const meta = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}

/**
 * Resolve a playable media src for CSP media-src 'self' blob:.
 * data: URLs become object URLs (caller must revoke when revoke is true).
 */
export function resolvePlayableMediaSrc(src: string): { url: string; revoke: boolean } {
  if (src.startsWith('data:')) {
    return { url: URL.createObjectURL(blobFromDataUrl(src)), revoke: true };
  }
  return { url: src, revoke: false };
}
