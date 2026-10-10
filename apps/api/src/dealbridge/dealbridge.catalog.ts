import { DEALBRIDGE_CORRIDORS, DEALBRIDGE_SCHEMA_VERSION } from './dealbridge.types';
import { resolveReceiptSigningKey } from './dealbridge.receipt-signer';

export function dealbridgeCatalog() {
  const signing = resolveReceiptSigningKey();
  return {
    id: 'dealbridge',
    name: 'Lugemi DealBridge',
    headline: 'Speak your language. Confirm the same deal.',
    description:
      'Discuss trade in your preferred language, clarify important terms, and keep a shared record of what both parties confirmed.',
    schemaVersion: DEALBRIDGE_SCHEMA_VERSION,
    featureFlag: 'dealBridge',
    corridors: DEALBRIDGE_CORRIDORS,
    receiptSigning: {
      keyId: signing.keyId,
      fixtureSigning: signing.fixture,
      note: signing.fixture
        ? 'DEALBRIDGE_RECEIPT_SIGNING_KEY unset — using labeled local-dev fixture key. Not for production integrity claims.'
        : 'HMAC receipt signing configured.',
    },
    limitations: [
      'Payment execution, voice cloning, automated dispute decisions, and legally binding e-signatures are out of MVP scope.',
      'A receipt signature proves integrity of the issued record, not translation accuracy or legal enforceability.',
      'Corridor coverage is gated per ASR/translation/TTS capability; unsupported pairs return errors, never simulated translations in production mode.',
      'Demo and fixture sessions remain labeled and cannot be unmarked by a production setting.',
    ],
  };
}
