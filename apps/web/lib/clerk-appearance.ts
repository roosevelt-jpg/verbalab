/**
 * Lugemi teal/navy theme for embedded Clerk SignIn / SignUp.
 * Clerk still owns the credential fields; Lugemi owns the surrounding chrome
 * and the multi-step /onboarding wizard after session creation.
 *
 * Development-instance “Development mode” / Clerk watermark cannot be removed
 * from application code — see docs/clerk-auth-branding.md.
 */
export const lugemiClerkAppearance = {
  layout: {
    logoImageUrl: '/brand/lugemi-symbol-teal.svg',
    logoPlacement: 'inside' as const,
    logoLinkUrl: '/',
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
    showOptionalFields: true,
    animations: true,
  },
  variables: {
    colorPrimary: '#007c78',
    colorDanger: '#b42318',
    colorSuccess: '#16794a',
    colorWarning: '#b54708',
    colorNeutral: '#52647a',
    colorText: '#172b4d',
    colorTextSecondary: '#52647a',
    colorTextOnPrimaryBackground: '#ffffff',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#172b4d',
    borderRadius: '8px',
    fontFamily: 'var(--font-ui), "Noto Sans", sans-serif',
    fontFamilyButtons: 'var(--font-ui), "Noto Sans", sans-serif',
    fontSize: '0.95rem',
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '26rem',
      margin: '0 auto',
    },
    card: {
      boxShadow: 'none',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      background: '#ffffff',
      padding: '1.5rem 1.35rem 1.25rem',
    },
    headerTitle: {
      fontFamily: 'var(--font-ui), "Noto Sans", sans-serif',
      fontWeight: '700',
      fontSize: '1.35rem',
      letterSpacing: '-0.02em',
      color: '#10264d',
    },
    headerSubtitle: {
      color: '#52647a',
      fontSize: '0.92rem',
    },
    socialButtonsBlockButton: {
      borderColor: '#cbd5e1',
      borderRadius: '8px',
    },
    formButtonPrimary: {
      backgroundColor: '#007c78',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.95rem',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: '#006662',
      },
      '&:focus': {
        boxShadow: '0 0 0 3px rgba(0, 184, 174, 0.35)',
      },
    },
    formFieldInput: {
      borderRadius: '8px',
      borderColor: '#cbd5e1',
      '&:focus': {
        borderColor: '#00b8ae',
        boxShadow: '0 0 0 3px rgba(0, 184, 174, 0.22)',
      },
    },
    footerActionLink: {
      color: '#007c78',
      fontWeight: '600',
    },
    identityPreviewEditButton: {
      color: '#007c78',
    },
    formFieldLabel: {
      color: '#172b4d',
      fontWeight: '600',
    },
    dividerLine: {
      backgroundColor: '#cbd5e1',
    },
    dividerText: {
      color: '#52647a',
    },
  },
};

export const lugemiClerkLocalization = {
  signIn: {
    start: {
      title: 'Sign in to Lugemi',
      subtitle: 'Welcome back — continue to your workspace',
    },
  },
  signUp: {
    start: {
      title: 'Create your Lugemi account',
      subtitle: 'Then choose Creative or Agents, personalize, and pick a plan',
    },
  },
};
