/** Default uploaded 3D anamorphic stills by panel variant — platform-wide fallback. */
export const ANAMORPHIC_STILLS = {
  voice: '/brand/media/products/product-voice.jpg',
  speech: '/brand/media/products/product-speech.jpg',
  translate: '/brand/media/products/product-translate.jpg',
  agents: '/brand/media/platform/platform-agents.jpg',
  api: '/brand/media/platform/platform-api.jpg',
  coverage: '/brand/media/platform/platform-coverage.jpg',
  hub: '/brand/media/platform/platform-hub.jpg',
  hero: '/brand/media/platform/platform-hero.jpg',
} as const;

export type AnamorphicStillVariant = keyof typeof ANAMORPHIC_STILLS;

export function stillForVariant(variant: AnamorphicStillVariant | string | undefined): string {
  if (variant && variant in ANAMORPHIC_STILLS) {
    return ANAMORPHIC_STILLS[variant as AnamorphicStillVariant];
  }
  return ANAMORPHIC_STILLS.hub;
}
