/**
 * Looping motion beds for every anamorphic still — ElevenLabs-style ambient
 * product imagery. Prefer muted autoplay webm; CSS Ken Burns still covers
 * browsers that refuse video autoplay.
 */
import { ANAMORPHIC_STILLS, type AnamorphicStillVariant } from '@/lib/anamorphic-stills';

export const ANAMORPHIC_MOTION: Record<AnamorphicStillVariant, string> = {
  voice: '/brand/media/products/product-voice.webm',
  speech: '/brand/media/products/product-speech.webm',
  translate: '/brand/media/products/product-translate.webm',
  agents: '/brand/media/platform/platform-agents.webm',
  api: '/brand/media/platform/platform-api.webm',
  coverage: '/brand/media/platform/platform-coverage.webm',
  hub: '/brand/media/platform/platform-hub.webm',
  hero: '/brand/media/platform/platform-hero.webm',
};

export const USECASE_MOTION: Record<string, string> = {
  '/brand/media/usecases/usecase-trade.jpg': '/brand/media/usecases/usecase-trade.webm',
  '/brand/media/usecases/usecase-education.jpg': '/brand/media/usecases/usecase-education.webm',
  '/brand/media/usecases/usecase-sales.jpg': '/brand/media/usecases/usecase-sales.webm',
  '/brand/media/usecases/usecase-public-speech.jpg':
    '/brand/media/usecases/usecase-public-speech.webm',
  '/brand/media/usecases/usecase-cx.jpg': '/brand/media/usecases/usecase-cx.webm',
  '/brand/media/usecases/usecase-creative.jpg': '/brand/media/usecases/usecase-creative.webm',
};

export function motionForVariant(variant: AnamorphicStillVariant | string | undefined): string {
  if (variant && variant in ANAMORPHIC_MOTION) {
    return ANAMORPHIC_MOTION[variant as AnamorphicStillVariant];
  }
  return ANAMORPHIC_MOTION.hub;
}

export function motionForStill(imageUrl: string | undefined, variant?: string): string | undefined {
  if (imageUrl && USECASE_MOTION[imageUrl]) return USECASE_MOTION[imageUrl];
  if (imageUrl) {
    for (const [key, still] of Object.entries(ANAMORPHIC_STILLS)) {
      if (still === imageUrl) return ANAMORPHIC_MOTION[key as AnamorphicStillVariant];
    }
  }
  if (variant) return motionForVariant(variant);
  return undefined;
}
