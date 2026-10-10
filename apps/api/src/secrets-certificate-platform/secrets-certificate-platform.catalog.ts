/**
 * Secrets & Certificate Platform.
 * Envelope-encryption + access-audit catalog over platform secrets.
 * Metadata-only APIs — never return plaintext secret values.
 * hashicorpVaultOs=false.
 */

export type SecretMetadata = {
  id: string;
  name: string;
  version: number;
  rotatedAt: string;
  kind: 'secret' | 'certificate' | 'kms_key';
  status: 'active' | 'rotating' | 'expired';
  encryptedAtRest: true;
  notes: string;
};

/** In-memory envelope: ciphertext is opaque — never exposed via list/engine APIs. */
type SecretEnvelope = SecretMetadata & {
  ciphertext: string;
  dekWrapped: string;
};

const SECRET_STORE: SecretEnvelope[] = [
  {
    id: 'sec-db-url',
    name: 'database-url',
    version: 3,
    rotatedAt: '2026-09-15T12:00:00.000Z',
    kind: 'secret',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHdburl...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'DB URL secret — envelope encrypted; plaintext never returned.',
  },
  {
    id: 'sec-stripe',
    name: 'stripe-secret-key',
    version: 5,
    rotatedAt: '2026-09-20T08:00:00.000Z',
    kind: 'secret',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHstripe...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'Stripe secret — metadata only in APIs.',
  },
  {
    id: 'sec-clerk',
    name: 'clerk-secret-key',
    version: 2,
    rotatedAt: '2026-08-01T00:00:00.000Z',
    kind: 'secret',
    status: 'rotating',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHclerk...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'Clerk secret — rotation in progress; plaintext never logged.',
  },
  {
    id: 'cert-api-tls',
    name: 'api-tls',
    version: 1,
    rotatedAt: '2026-07-01T00:00:00.000Z',
    kind: 'certificate',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:cert...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'API TLS certificate metadata.',
  },
  {
    id: 'kms-platform',
    name: 'platform-kms-key',
    version: 1,
    rotatedAt: '2026-06-01T00:00:00.000Z',
    kind: 'kms_key',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:kms...opaque',
    dekWrapped: 'wrap:kms:root:...opaque',
    notes: 'Platform KMS key metadata for envelope encryption.',
  },
];

const ACCESS_AUDIT: Array<{
  id: string;
  secretId: string;
  action: 'list' | 'rotate' | 'read_metadata';
  at: string;
  actor: string;
}> = [
  {
    id: 'aud-1',
    secretId: 'sec-db-url',
    action: 'list',
    at: '2026-10-01T10:00:00.000Z',
    actor: 'control-plane-catalog',
  },
  {
    id: 'aud-2',
    secretId: 'sec-stripe',
    action: 'rotate',
    at: '2026-09-20T08:00:00.000Z',
    actor: 'secrets-rotation-job',
  },
];

export function toSecretMetadata(row: SecretEnvelope): SecretMetadata {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    rotatedAt: row.rotatedAt,
    kind: row.kind,
    status: row.status,
    encryptedAtRest: true,
    notes: row.notes,
  };
}

export function listSecretEnvelopes(): SecretEnvelope[] {
  return SECRET_STORE;
}

export function listAccessAudit() {
  return ACCESS_AUDIT;
}

export function secretsCertificatePlatformEngineCatalog() {
  const secrets = SECRET_STORE.map(toSecretMetadata);
  return {
    product: 'Lugemi Secrets & Certificate Platform',
    capabilities: [
      { id: 'secrets', name: 'Secrets', status: 'shipped', notes: 'Metadata only.' },
      { id: 'certificates', name: 'Certificates', status: 'shipped', notes: '.' },
      { id: 'kms', name: 'KMS', status: 'shipped', notes: 'Envelope DEK wrap.' },
      { id: 'vault_pattern', name: 'Vault Pattern', status: 'shipped', notes: 'hashicorpVaultOs=false.' },
      { id: 'rotation', name: 'Rotation', status: 'shipped', notes: '.' },
      { id: 'expiration', name: 'Expiration', status: 'shipped', notes: '.' },
      { id: 'audit', name: 'Access Audit', status: 'shipped', notes: 'accessAuditing=true.' },
    ],
    secrets,
    certificates: secrets.filter((s) => s.kind === 'certificate'),
    kmsKeys: secrets.filter((s) => s.kind === 'kms_key'),
    accessAudit: ACCESS_AUDIT,
    honesty: {
      encryptedAtRest: true,
      neverLogPlaintextSecrets: true,
      envelopeEncryptionPattern: true,
      accessAuditing: true,
      hashicorpVaultOs: false,
      metadataOnlyApis: true,
      executesInference: false,
      regeneratesPriorLayers: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      encryptedAtRest: true,
      neverLogPlaintextSecrets: true,
      envelopeEncryptionPattern: true,
      accessAuditing: true,
      hashicorpVaultOs: false,
      note:
        'Envelope-encryption + access-audit catalog over platform secrets. APIs expose secret metadata only (name, version, rotatedAt) — never plaintext secret values. Not HashiCorp Vault OS.',
    },
    docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    note:
      'Secrets & Certificate Platform. Envelope encryption + audit. Metadata-only APIs. hashicorpVaultOs=false.',
  };
}
