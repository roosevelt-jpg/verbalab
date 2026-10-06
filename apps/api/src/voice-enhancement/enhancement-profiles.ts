import {
  analyzeAudioBuffer,
  enhanceAudio,
  isolateVoice,
  softLimitAudio,
  upscaleAudio,
  type AudioAnalysis,
} from '../audio-intelligence/audio-dsp';

export type EnhancementProfileId =
  | 'noise_removal'
  | 'microphone_cleanup'
  | 'podcast_cleanup'
  | 'broadcast'
  | 'meeting_cleanup'
  | 'voice_restoration'
  | 'upscale';

export type EnhancementProfile = {
  id: EnhancementProfileId;
  name: string;
  category: 'cleanup' | 'broadcast' | 'restore' | 'upscale';
  description: string;
  steps: string[];
  spectralMl: false;
  echoCancellation: false;
};

export const ENHANCEMENT_PROFILES: EnhancementProfile[] = [
  {
    id: 'noise_removal',
    name: 'Noise Removal',
    category: 'cleanup',
    description: 'Noise gate + high-pass + normalize ( enhance path).',
    steps: ['enhance'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'microphone_cleanup',
    name: 'Microphone Cleanup',
    category: 'cleanup',
    description: 'Stronger gate + rumble cut for laptop/headset mics.',
    steps: ['enhance_strong'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'podcast_cleanup',
    name: 'Podcast Cleanup',
    category: 'cleanup',
    description: 'Gentle gate + voice isolation + linear upsample toward 44.1 kHz.',
    steps: ['enhance_gentle', 'isolate', 'upscale_44100'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'broadcast',
    name: 'Broadcast Audio',
    category: 'broadcast',
    description: 'Enhance + soft limit toward louder peaks. Not LUFS broadcast mastering.',
    steps: ['enhance', 'soft_limit'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'meeting_cleanup',
    name: 'Meeting Cleanup',
    category: 'cleanup',
    description: 'Enhance + energy VAD isolation for call recordings.',
    steps: ['enhance', 'isolate'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'voice_restoration',
    name: 'Voice Restoration',
    category: 'restore',
    description:
      'Aggressive gate + HPF + normalize for muffled clips. Not archival bandwidth-extension ML.',
    steps: ['restore_enhance'],
    spectralMl: false,
    echoCancellation: false,
  },
  {
    id: 'upscale',
    name: 'Audio Upscaling',
    category: 'upscale',
    description: 'Linear sample-rate interpolation (default 32 kHz).',
    steps: ['upscale_32000'],
    spectralMl: false,
    echoCancellation: false,
  },
];

export function getEnhancementProfile(id: string): EnhancementProfile | undefined {
  return ENHANCEMENT_PROFILES.find((p) => p.id === id);
}

export type ProfileEnhanceResult = {
  profile: EnhancementProfile;
  wav: Buffer;
  analysisBefore: AudioAnalysis;
  analysisAfter: AudioAnalysis;
  stepsApplied: string[];
  note: string;
};

/** Run a named cleanup profile over PCM heuristics — not third-party noise-cancellation / enhance / stem-separation. */
export function applyEnhancementProfile(
  buffer: Buffer,
  profileId: string,
  options?: { targetRate?: number },
): ProfileEnhanceResult {
  const profile = getEnhancementProfile(profileId);
  if (!profile) {
    throw new Error(`Unknown enhancement profile "${profileId}"`);
  }

  const analysisBefore = analyzeAudioBuffer(buffer);
  let wav = buffer;
  const stepsApplied: string[] = [];

  for (const step of profile.steps) {
    if (step === 'enhance') {
      wav = enhanceAudio(wav).wav;
      stepsApplied.push('enhance');
    } else if (step === 'enhance_strong') {
      wav = enhanceAudio(wav, {
        gateMultiplier: 3.8,
        hpAlpha: 0.98,
        gateFloor: 0.06,
        targetPeak: 0.88,
      }).wav;
      stepsApplied.push('enhance_strong');
    } else if (step === 'enhance_gentle') {
      wav = enhanceAudio(wav, {
        gateMultiplier: 1.8,
        hpAlpha: 0.94,
        gateFloor: 0.2,
        targetPeak: 0.85,
      }).wav;
      stepsApplied.push('enhance_gentle');
    } else if (step === 'restore_enhance') {
      wav = enhanceAudio(wav, {
        gateMultiplier: 4.2,
        hpAlpha: 0.985,
        gateFloor: 0.04,
        targetPeak: 0.92,
      }).wav;
      stepsApplied.push('restore_enhance');
    } else if (step === 'isolate') {
      wav = isolateVoice(wav).wav;
      stepsApplied.push('isolate');
    } else if (step === 'soft_limit') {
      wav = softLimitAudio(wav, 0.72, 2.8);
      stepsApplied.push('soft_limit');
    } else if (step === 'upscale_44100') {
      wav = upscaleAudio(wav, options?.targetRate ?? 44100).wav;
      stepsApplied.push('upscale_44100');
    } else if (step === 'upscale_32000') {
      wav = upscaleAudio(wav, options?.targetRate ?? 32000).wav;
      stepsApplied.push('upscale_32000');
    }
  }

  const analysisAfter = analyzeAudioBuffer(wav);
  return {
    profile,
    wav,
    analysisBefore,
    analysisAfter,
    stepsApplied,
    note: `${profile.name}: heuristic DSP chain [${stepsApplied.join(' → ')}]. Not spectral ML denoise, AEC, or broadcast LUFS mastering.`,
  };
}
