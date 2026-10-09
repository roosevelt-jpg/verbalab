/**
 * Lugemi teal/navy theme for embedded Clerk SignIn / SignUp.
 * Clerk owns credential fields only; AuthShell owns brand chrome.
 * Duplicate Clerk logo/titles are hidden so the first viewport is Lugemi-first.
 *
 * Development-instance “Development mode” / Clerk watermark cannot be removed
 * from application code — see docs/clerk-auth-branding.md.
 */
export const lugemiClerkAppearance = {
  layout: {
    logoPlacement: 'none' as const,
    socialButtonsPlacement: 'top' as const,
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
      maxWidth: '24rem',
      margin: '0 auto',
    },
    card: {
      boxShadow: 'none',
      border: 'none',
      borderRadius: '0',
      background: 'transparent',
      padding: '0',
      width: '100%',
    },
    header: {
      display: 'none',
    },
    headerTitle: {
      display: 'none',
    },
    headerSubtitle: {
      display: 'none',
    },
    logoBox: {
      display: 'none',
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
