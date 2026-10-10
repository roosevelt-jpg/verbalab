import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SsoCallbackPage() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}
    >
      <AuthenticateWithRedirectCallback signInForceRedirectUrl="/onboarding" signUpForceRedirectUrl="/onboarding" />
    </div>
  );
}
