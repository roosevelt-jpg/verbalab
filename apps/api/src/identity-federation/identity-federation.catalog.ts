/**
 * Library Phase 166 → Identity Federation (VL-299).
 * Discovery/honest federation readiness over Clerk — not Okta/SAML IdP OS.
 */
export function identityFederationEngineCatalog() {
  return {
    product: 'Lugemi Identity Federation',
    capabilities: [
      { id: 'oauth2', name: 'OAuth2', status: 'shipped', notes: 'OAuth2 federation readiness via Clerk.' },
      { id: 'oidc', name: 'OIDC', status: 'shipped', notes: 'OIDC via Clerk.' },
      { id: 'saml', name: 'SAML', status: 'partial', notes: 'SAML readiness catalog — samlIdpOs=false.' },
      { id: 'scim', name: 'SCIM', status: 'partial', notes: 'SCIM readiness catalog.' },
      { id: 'enterprise', name: 'Enterprise Identity', status: 'shipped', notes: 'Enterprise IdP discovery.' },
      { id: 'federated', name: 'Federated Identity', status: 'shipped', notes: 'Federation readiness.' },
      { id: 'machine', name: 'Machine Identity', status: 'shipped', notes: 'API key / machine identity catalog.' },
      { id: 'service', name: 'Service Identity', status: 'shipped', notes: 'Service identity catalog.' },
      { id: 'certificates', name: 'Certificate Management', status: 'partial', notes: 'Cert readiness — not PKI OS.' },
    ],
    federation: [
      {
        id: 'fed-clerk',
        provider: 'Clerk',
        protocols: ['oauth2', 'oidc'],
        status: 'ready',
        notes: 'Primary identity via existing Clerk integration.',
      },
      {
        id: 'fed-saml-ready',
        provider: 'Enterprise SAML (discovery)',
        protocols: ['saml'],
        status: 'discovery',
        notes: 'Federation readiness only — Lugemi is not a SAML IdP OS.',
      },
      {
        id: 'fed-scim-ready',
        provider: 'SCIM directory (discovery)',
        protocols: ['scim'],
        status: 'discovery',
        notes: 'SCIM readiness catalog — not full directory OS.',
      },
      {
        id: 'fed-machine',
        provider: 'Lugemi API keys',
        protocols: ['api_key'],
        status: 'ready',
        notes: 'Machine/service identity via existing API keys.',
      },
    ],
    honesty: {
      oktaOs: false,
      samlIdpOs: false,
      regeneratesClerk: false,
      extendsClerkIdentity: true,
      federationReadinessOnly: true,
    },
    safety: {
      oktaOs: false,
      samlIdpOs: false,
      note: 'Identity Federation is discovery/readiness over Clerk and existing API keys — not Okta OS or a SAML IdP OS.',
    },
    docs: '/docs/IDENTITY_FEDERATION.md',
    note: 'Identity Federation (VL-299). OAuth2/OIDC/SAML/SCIM/enterprise/machine/service identity catalog. oktaOs=false; samlIdpOs=false.',
  };
}
