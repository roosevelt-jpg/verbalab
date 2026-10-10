import { LanguageIntegrityClient } from './language-integrity-client';

/** Public authenticity panel — engine/protocol are unauthenticated; workspace verify needs sign-in. */
export default function LanguageIntegrityPage() {
  return <LanguageIntegrityClient />;
}
