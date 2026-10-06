export function audioMaxBytes: number {
  const raw = Number(process.env.AUDIO_MAX_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 10 * 1024 * 1024;
}
