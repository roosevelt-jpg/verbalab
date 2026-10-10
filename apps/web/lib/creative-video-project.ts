/** Browser-local LugemiCreative video projects (script → native voice → export). */

export type VideoScene = {
  id: string;
  title: string;
  caption: string;
  durationSec: number;
  /** Optional still (data URL) shown during this scene. */
  imageDataUrl?: string;
  background: string;
};

export type VideoNarration = {
  mimeType: string;
  /** Persisted as data URL so projects survive reload. */
  audioDataUrl: string;
  voiceId: string;
  voiceName?: string;
  accentId?: string;
  speechVariety?: string;
  locale?: string;
  characterCount: number;
  generatedAt: string;
};

export type CreativeVideoProject = {
  id: string;
  title: string;
  kind: 'video' | 'audio';
  script: string;
  accentId: string;
  voiceId: string;
  locale?: string;
  speechVariety?: string;
  culturalIdentity?: string;
  scenes: VideoScene[];
  narration: VideoNarration | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = 'lugemi.creative.studio.projects.v2';
/** Legacy key from studio list-only storage. */
const LEGACY_KEY = 'lugemi.creative.studio.projects.v1';

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SCENE_BACKGROUNDS = [
  'linear-gradient(135deg,#0c1f3f 0%,#0a3d3a 55%,#007c78 100%)',
  'linear-gradient(140deg,#10264d 0%,#163a5a 45%,#00b8ae 100%)',
  'linear-gradient(125deg,#0a2a3a 0%,#1a4a48 50%,#2d6a66 100%)',
  'linear-gradient(150deg,#142848 0%,#0c3d4a 60%,#00a89e 100%)',
];

export function defaultScenesFromScript(script: string): VideoScene[] {
  const chunks = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const lines = chunks.length ? chunks : [script.trim() || 'Your narration appears here.'];
  return lines.map((line, i) => ({
    id: uid('scene'),
    title: `Scene ${i + 1}`,
    caption: line.slice(0, 160),
    durationSec: Math.max(3, Math.min(12, Math.round(line.split(/\s+/).length / 2.2))),
    background: SCENE_BACKGROUNDS[i % SCENE_BACKGROUNDS.length]!,
  }));
}

export function createVideoProject(input: {
  title: string;
  script?: string;
  kind?: 'video' | 'audio';
  accentId?: string;
  voiceId?: string;
}): CreativeVideoProject {
  const script = (input.script ?? '').trim();
  const now = new Date().toISOString();
  return {
    id: uid('proj'),
    title: input.title.trim() || 'Untitled video',
    kind: input.kind ?? 'video',
    script,
    accentId: input.accentId ?? '',
    voiceId: input.voiceId ?? 'alloy',
    scenes: defaultScenesFromScript(script || input.title),
    narration: null,
    role: 'Owner',
    createdAt: now,
    updatedAt: now,
  };
}

function migrateLegacy(): CreativeVideoProject[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const rows = JSON.parse(raw) as Array<{
      id: string;
      title: string;
      kind?: string;
      updatedAt?: string;
      role?: string;
    }>;
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({
      id: r.id,
      title: r.title || 'Untitled project',
      kind: r.kind === 'audio' ? 'audio' : 'video',
      script: r.title || '',
      accentId: '',
      voiceId: 'alloy',
      scenes: defaultScenesFromScript(r.title || 'Untitled'),
      narration: null,
      role: r.role || 'Owner',
      createdAt: r.updatedAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function loadVideoProjects(): CreativeVideoProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CreativeVideoProject[];
      return Array.isArray(parsed) ? parsed : [];
    }
    const migrated = migrateLegacy();
    if (migrated.length) saveVideoProjects(migrated);
    return migrated;
  } catch {
    return [];
  }
}

export function saveVideoProjects(rows: CreativeVideoProject[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* quota — caller may show a note */
  }
}

export function getVideoProject(id: string): CreativeVideoProject | null {
  return loadVideoProjects().find((p) => p.id === id) ?? null;
}

export function upsertVideoProject(project: CreativeVideoProject): CreativeVideoProject {
  const next = { ...project, updatedAt: new Date().toISOString() };
  const rows = loadVideoProjects();
  const idx = rows.findIndex((p) => p.id === next.id);
  if (idx >= 0) rows[idx] = next;
  else rows.unshift(next);
  saveVideoProjects(rows);
  return next;
}

export function deleteVideoProject(id: string) {
  saveVideoProjects(loadVideoProjects().filter((p) => p.id !== id));
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read audio'));
    reader.readAsDataURL(blob);
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function projectTotalDuration(project: CreativeVideoProject): number {
  if (!project.scenes.length) return 0;
  return project.scenes.reduce((sum, s) => sum + Math.max(0.5, s.durationSec), 0);
}

/**
 * Render scenes on a canvas while playing narration, then encode WebM for download.
 * Falls back to throwing if MediaRecorder / captureStream are unavailable.
 */
export async function exportProjectWebM(
  project: CreativeVideoProject,
  opts?: { width?: number; height?: number; onProgress?: (fraction: number) => void },
): Promise<Blob> {
  if (!project.narration?.audioDataUrl) {
    throw new Error('Generate narration before exporting video.');
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video export is not supported in this browser.');
  }

  const width = opts?.width ?? 1280;
  const height = opts?.height ?? 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) throw new Error('Canvas unavailable');
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const audio = new Audio(project.narration.audioDataUrl);
  audio.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    audio.onloadedmetadata = () => resolve();
    audio.onerror = () => reject(new Error('Could not load narration audio'));
  });

  const scenes = project.scenes.length
    ? project.scenes
    : defaultScenesFromScript(project.script || project.title);
  const audioDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : projectTotalDuration(project);
  const sceneSum = scenes.reduce((s, sc) => s + sc.durationSec, 0) || 1;
  const scaled = scenes.map((sc) => ({
    ...sc,
    durationSec: (sc.durationSec / sceneSum) * audioDuration,
  }));

  const images = await Promise.all(
    scaled.map(async (sc) => {
      if (!sc.imageDataUrl) return null;
      const img = new Image();
      img.src = sc.imageDataUrl;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
      return img;
    }),
  );

  const canvasStream = canvas.captureStream(30);
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);
  source.connect(audioCtx.destination);

  const mixed = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      void audioCtx.close().catch(() => undefined);
      resolve(new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' }));
    };
    recorder.onerror = () => reject(new Error('Recording failed'));
  });

  function drawFrame(t: number) {
    let cursor = 0;
    let active = scaled[0]!;
    let activeIdx = 0;
    for (let i = 0; i < scaled.length; i += 1) {
      const sc = scaled[i]!;
      if (t < cursor + sc.durationSec) {
        active = sc;
        activeIdx = i;
        break;
      }
      cursor += sc.durationSec;
      active = sc;
      activeIdx = i;
    }

    ctx.fillStyle = '#0c1f3f';
    ctx.fillRect(0, 0, width, height);

    const img = images[activeIdx];
    if (img && img.complete && img.naturalWidth) {
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      ctx.fillStyle = 'rgba(8, 20, 40, 0.45)';
      ctx.fillRect(0, 0, width, height);
    } else {
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, '#0c1f3f');
      g.addColorStop(0.55, '#0a3d3a');
      g.addColorStop(1, '#007c78');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `600 ${Math.round(width * 0.028)}px system-ui, sans-serif`;
    ctx.fillText(project.title.slice(0, 48), 64, 88);

    ctx.fillStyle = '#e8f7f6';
    ctx.font = `650 ${Math.round(width * 0.042)}px Georgia, "Times New Roman", serif`;
    wrapText(ctx, active.caption || active.title, 64, height * 0.42, width - 128, Math.round(width * 0.055));

    if (project.culturalIdentity || project.speechVariety) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `500 ${Math.round(width * 0.018)}px system-ui, sans-serif`;
      ctx.fillText(
        [project.culturalIdentity, project.speechVariety].filter(Boolean).join(' · ').slice(0, 80),
        64,
        height - 56,
      );
    }

    opts?.onProgress?.(Math.min(1, t / Math.max(0.01, audioDuration)));
  }

  function wrapText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const words = text.split(/\s+/);
    let line = '';
    let yy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        context.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) context.fillText(line, x, yy);
  }

  recorder.start(200);
  await audioCtx.resume();
  await audio.play();

  const started = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = Math.min(audioDuration, (performance.now() - started) / 1000);
      drawFrame(t);
      if (t >= audioDuration - 0.05 || audio.ended || audio.paused) {
        drawFrame(audioDuration);
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  audio.pause();
  recorder.stop();
  return done;
}

export function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'lugemi-video'
  );
}
