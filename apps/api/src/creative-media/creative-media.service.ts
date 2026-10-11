import { Injectable } from '@nestjs/common';
import { encodePngRgb } from './png';
import { encodeWavPcm16, hashSeed, mulberry32 } from './wav';

export type CreativeMediaEngine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: 'shipped'; notes: string }>;
};

@Injectable()
export class CreativeMediaService {
  engine(): CreativeMediaEngine {
    return {
      product: 'Lugemi Creative Media',
      note: 'First-party procedural image, SFX, and music generation for Creative Studio — authenticated and metered via workspace keys.',
      capabilities: [
        {
          id: 'image',
          name: 'Scene still generation',
          status: 'shipped',
          notes: 'Prompt-conditioned PNG stills for Studio scenes and Image & Video.',
        },
        {
          id: 'video_plan',
          name: 'Video scene pack',
          status: 'shipped',
          notes: 'Script → scene captions + generated stills for WebM export with Echo narration.',
        },
        {
          id: 'sfx',
          name: 'Sound effects',
          status: 'shipped',
          notes: 'Prompt-routed WAV Foley/ambience/UI synthesis.',
        },
        {
          id: 'music',
          name: 'Music beds',
          status: 'shipped',
          notes: 'Prompt/genre-conditioned WAV beds for intros and underscoring.',
        },
      ],
    };
  }

  generateImage(input: {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
    seed?: number;
  }) {
    const prompt = input.prompt.trim().slice(0, 400) || 'Lugemi scene';
    const style = (input.style || inferImageStyle(prompt)).toLowerCase();
    const width = clamp(input.width ?? 960, 320, 1280);
    const height = clamp(input.height ?? 540, 180, 720);
    const seed = input.seed ?? hashSeed(`${prompt}|${style}`);
    const rng = mulberry32(seed);
    const palette = paletteFor(style, prompt, rng);

    const png = encodePngRgb(width, height, (x, y) => {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const wave = Math.sin((u * 6 + v * 3 + seed * 0.0001) * Math.PI) * 0.5 + 0.5;
      const beam = Math.exp(-((u - 0.72) ** 2 + (v - 0.28) ** 2) * 8);
      const grain = (rng() - 0.5) * 12;
      const depth = 0.35 + 0.45 * (1 - v) + 0.2 * wave;
      let r = mix(palette.deep[0], palette.mid[0], depth) + palette.accent[0] * beam * 0.55;
      let g = mix(palette.deep[1], palette.mid[1], depth) + palette.accent[1] * beam * 0.55;
      let b = mix(palette.deep[2], palette.mid[2], depth) + palette.accent[2] * beam * 0.55;
      // Soft anamorphic plane bands
      if (Math.abs(v - (0.55 + 0.08 * Math.sin(u * 8))) < 0.02) {
        r = mix(r, palette.accent[0], 0.35);
        g = mix(g, palette.accent[1], 0.35);
        b = mix(b, palette.accent[2], 0.35);
      }
      return [
        clampByte(r + grain),
        clampByte(g + grain),
        clampByte(b + grain),
      ];
    });

    return {
      mimeType: 'image/png' as const,
      imageBase64: png.toString('base64'),
      width,
      height,
      prompt,
      style,
      seed,
      engine: 'lugemi-creative-image-v1',
    };
  }

  generateVideoPlan(input: { script: string; title?: string; style?: string }) {
    const script = input.script.trim() || input.title?.trim() || 'Lugemi Creative video';
    const chunks = script
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    const lines = chunks.length ? chunks : [script];
    const style = input.style || inferImageStyle(script);
    const scenes = lines.map((caption, index) => {
      const image = this.generateImage({
        prompt: `${caption} — ${input.title || 'video scene'} (${style})`,
        style,
        seed: hashSeed(`${script}|${index}|${caption}`),
      });
      return {
        index,
        title: `Scene ${index + 1}`,
        caption: caption.slice(0, 160),
        durationSec: Math.max(3, Math.min(12, Math.round(caption.split(/\s+/).length / 2.2))),
        imagePrompt: image.prompt,
        mimeType: image.mimeType,
        imageBase64: image.imageBase64,
        style: image.style,
        seed: image.seed,
      };
    });
    return {
      title: input.title?.trim() || 'Video project',
      script,
      style,
      sceneCount: scenes.length,
      scenes,
      engine: 'lugemi-creative-video-plan-v1',
      note: 'Pair with Echo TTS narration and Studio WebM export for a full video.',
    };
  }

  generateSfx(input: { prompt: string; durationSec?: number }) {
    const prompt = input.prompt.trim().slice(0, 240) || 'soft ambience';
    const profile = classifySfx(prompt);
    const durationSec = clamp(input.durationSec ?? profile.defaultDuration, 0.3, 12);
    const sampleRate = 22050;
    const n = Math.floor(durationSec * sampleRate);
    const samples = new Float32Array(n);
    const rng = mulberry32(hashSeed(prompt + profile.id));

    for (let i = 0; i < n; i += 1) {
      const t = i / sampleRate;
      const env = Math.min(1, t * 8) * Math.min(1, (durationSec - t) * 4);
      let s = 0;
      if (profile.id === 'rain') {
        s = (rng() * 2 - 1) * 0.22 * env;
        s += Math.sin(2 * Math.PI * (180 + rng() * 40) * t) * 0.02 * env;
      } else if (profile.id === 'footsteps') {
        const step = Math.abs(Math.sin(t * Math.PI * 2.2));
        const hit = step > 0.92 ? (rng() * 2 - 1) * Math.pow((step - 0.92) / 0.08, 2) : 0;
        s = hit * 0.7;
      } else if (profile.id === 'ui') {
        const f = 880 * Math.pow(2, Math.min(t, 0.25) * 2);
        s = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 6) * 0.45;
        s += Math.sin(2 * Math.PI * (f * 1.5) * t) * Math.exp(-t * 8) * 0.2;
      } else if (profile.id === 'impact') {
        s =
          (rng() * 2 - 1) * Math.exp(-t * 14) * 0.7 +
          Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 5) * 0.45;
      } else if (profile.id === 'urban') {
        s =
          (rng() * 2 - 1) * 0.08 * env +
          Math.sin(2 * Math.PI * (90 + 20 * Math.sin(t * 0.7)) * t) * 0.05 * env;
      } else {
        // ambience / foley default
        s =
          (rng() * 2 - 1) * 0.12 * env +
          Math.sin(2 * Math.PI * (220 + 40 * Math.sin(t * 0.5)) * t) * 0.04 * env;
      }
      samples[i] = Math.max(-1, Math.min(1, s));
    }

    const wav = encodeWavPcm16(samples, sampleRate);
    return {
      mimeType: 'audio/wav' as const,
      audioBase64: wav.toString('base64'),
      durationSec,
      prompt,
      profile: profile.id,
      engine: 'lugemi-creative-sfx-v1',
    };
  }

  generateMusic(input: { prompt: string; durationSec?: number; genre?: string }) {
    const prompt = input.prompt.trim().slice(0, 240) || 'ambient bed';
    const genre = (input.genre || inferGenre(prompt)).toLowerCase();
    const durationSec = clamp(input.durationSec ?? 16, 4, 45);
    const sampleRate = 22050;
    const n = Math.floor(durationSec * sampleRate);
    const samples = new Float32Array(n);
    const seed = hashSeed(prompt + genre);
    const rng = mulberry32(seed);
    const root = 110 * Math.pow(2, (seed % 12) / 12);
    const scale = genre.includes('afro')
      ? [0, 2, 3, 5, 7, 9, 10]
      : genre.includes('electronic') || genre.includes('fitness')
        ? [0, 2, 4, 7, 9]
        : genre.includes('cinematic')
          ? [0, 2, 3, 7, 8]
          : [0, 2, 4, 5, 7, 9, 11];
    const bpm = genre.includes('fitness') ? 118 : genre.includes('afro') ? 102 : 84;
    const beat = 60 / bpm;

    for (let i = 0; i < n; i += 1) {
      const t = i / sampleRate;
      const env =
        Math.min(1, t * 2) *
        Math.min(1, (durationSec - t) / 1.5) *
        (0.85 + 0.15 * Math.sin(t * 0.7));
      const chordIdx = Math.floor(t / (beat * 4)) % 4;
      const degree = scale[(chordIdx * 2) % scale.length]!;
      const freq = root * Math.pow(2, degree / 12);
      let s = 0;
      // Pad
      s += Math.sin(2 * Math.PI * freq * t) * 0.12;
      s += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.06;
      s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.08;
      // Pulse / arp
      const step = Math.floor(t / (beat / 2));
      const arpDeg = scale[step % scale.length]!;
      const arpF = root * 2 * Math.pow(2, arpDeg / 12);
      const pulse = Math.max(0, Math.sin((t % (beat / 2)) / (beat / 2) * Math.PI));
      s += Math.sin(2 * Math.PI * arpF * t) * pulse * 0.1;
      // Soft kick
      const bt = t % beat;
      if (bt < 0.12) {
        s += Math.sin(2 * Math.PI * (90 + bt * 400) * t) * Math.exp(-bt * 28) * 0.35;
      }
      // Noise shimmer for electronic
      if (genre.includes('electronic') || genre.includes('social')) {
        s += (rng() * 2 - 1) * 0.015 * env;
      }
      samples[i] = Math.max(-1, Math.min(1, s * env));
    }

    const wav = encodeWavPcm16(samples, sampleRate);
    return {
      mimeType: 'audio/wav' as const,
      audioBase64: wav.toString('base64'),
      durationSec,
      prompt,
      genre,
      engine: 'lugemi-creative-music-v1',
    };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function inferImageStyle(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/news|desk|headline/.test(p)) return 'news';
  if (/product|launch|demo/.test(p)) return 'product';
  if (/film|trailer|cinematic/.test(p)) return 'cinematic';
  if (/explain|lesson|educat/.test(p)) return 'explainer';
  return 'studio';
}

function paletteFor(style: string, prompt: string, rng: () => number) {
  const jitter = () => Math.floor(rng() * 18) - 9;
  if (style.includes('news')) {
    return {
      deep: [8 + jitter(), 18 + jitter(), 40 + jitter()] as [number, number, number],
      mid: [20, 50, 90] as [number, number, number],
      accent: [0, 184, 174] as [number, number, number],
    };
  }
  if (style.includes('product')) {
    return {
      deep: [12, 30, 48] as [number, number, number],
      mid: [0, 100, 96] as [number, number, number],
      accent: [120, 230, 220] as [number, number, number],
    };
  }
  if (style.includes('cinematic') || /film|trailer/.test(prompt.toLowerCase())) {
    return {
      deep: [20, 12, 28] as [number, number, number],
      mid: [90, 50, 30] as [number, number, number],
      accent: [230, 160, 80] as [number, number, number],
    };
  }
  return {
    deep: [11, 26, 54] as [number, number, number],
    mid: [16, 60, 77] as [number, number, number],
    accent: [0, 184, 174] as [number, number, number],
  };
}

function classifySfx(prompt: string): { id: string; defaultDuration: number } {
  const p = prompt.toLowerCase();
  if (/rain|storm|weather|window/.test(p)) return { id: 'rain', defaultDuration: 6 };
  if (/foot|step|gravel|walk/.test(p)) return { id: 'footsteps', defaultDuration: 4 };
  if (/ui|chime|notif|click|beep|confirm/.test(p)) return { id: 'ui', defaultDuration: 0.8 };
  if (/impact|hit|boom|punch|slam/.test(p)) return { id: 'impact', defaultDuration: 1.2 };
  if (/city|bus|traffic|urban|market/.test(p)) return { id: 'urban', defaultDuration: 5 };
  return { id: 'ambience', defaultDuration: 5 };
}

function inferGenre(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/afro|lagos|highlife|amapiano/.test(p)) return 'afrobeats';
  if (/cinematic|documentary|film|trailer/.test(p)) return 'cinematic';
  if (/electronic|edm|synth|fitness/.test(p)) return 'electronic';
  if (/piano|ballad|melancholy/.test(p)) return 'piano';
  if (/corporate|podcast|education/.test(p)) return 'corporate';
  if (/indie|rock|guitar/.test(p)) return 'indie';
  return 'ambient';
}
