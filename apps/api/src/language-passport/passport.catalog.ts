import { PASSPORT_ENTRY_TYPES, PASSPORT_PRODUCTS, PASSPORT_SCHEMA_VERSION } from './passport.types';
import { passportModelSyncSummary } from './passport.model-sync';

export function languagePassportCatalog() {
  return {
    product: 'language_passport',
    promise: 'Your language. Your meaning. Wherever you use Lugemi.',
    schemaVersion: PASSPORT_SCHEMA_VERSION,
    featureFlag: 'languagePassport',
    entryTypes: [...PASSPORT_ENTRY_TYPES],
    products: [...PASSPORT_PRODUCTS],
    modelSync: passportModelSyncSummary(),
    screens: [
      'profile_preferences',
      'entry_editor',
      'save_correction_prompt',
      'resolution_explanation',
      'sharing_preview',
      'history',
      'export_import',
      'privacy_controls',
    ],
    nonGoals: [
      'Not an identity document, nationality credential, or voice biometric.',
      'Does not infer ethnicity, personality, ability, or hidden intent.',
      'Does not silently fine-tune shared model weights from private corrections.',
      'Does not auto-approve deals, prices, quantities ordered, or business obligations.',
      'Caller ID cannot identify or retrieve a private Passport owner.',
    ],
    limits: {
      maxEntries: 2000,
      maxImportBytes: 512_000,
      maxImportEntries: 500,
      maxGrantTtlDays: 90,
      maxResolutionTextChars: 20_000,
    },
  };
}
