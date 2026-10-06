import { ACCENT_IDENTITY_SEEDS } from '../accents/accent-identity-seeds';
import type { VendorDefaultSeed } from './model-registry.seeds';

/**
 * Lugemi Echo Voice identity-linked model variants — one registry entry per accent identity pack.
 */
export function echoVoiceIdentityVariantSeeds(): VendorDefaultSeed[] {
  return ACCENT_IDENTITY_SEEDS.filter((s) => s.echoModelVariant).map((s) => ({
    slug: s.echoModelVariant!,
    feature: 'tts' as const,
    provider: 'own_tts',
    displayName: `Lugemi Echo Voice · ${s.nameEn.replace(/\s*\([^)]*\)\s*/g, ' ').trim()}`,
    baseModel: 'lugemi-echo-tts-v1',
    notes: `Identity variant for ${s.nameEn}. ${s.identityProfile.slice(0, 120)}… Linked accent identity pack: ${s.id}.`,
    envKey: null,
    role: 'primary' as const,
    kind: 'lugemi' as const,
  }));
}
