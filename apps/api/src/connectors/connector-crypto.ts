import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export type EncryptedConnectorSecrets = {
  enc: 1;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
};

export type ConnectorCredentials = {
  apiKey?: string;
  webhookUrl?: string;
  accountSid?: string;
  projectId?: string;
  teamId?: string;
  teamName?: string;
};

function keyBytes(): Buffer {
  const raw =
    process.env.CONNECTOR_SECRET_KEY?.trim() ||
    process.env.ENCRYPTION_KEY?.trim() ||
    'lugemi-dev-connector-secret-key';
  return createHash('sha256').update(raw).digest();
}

export function encryptConnectorCredentials(
  creds: ConnectorCredentials,
): EncryptedConnectorSecrets {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv);
  const plaintext = Buffer.from(JSON.stringify(creds), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    enc: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptConnectorCredentials(
  stored: EncryptedConnectorSecrets,
): ConnectorCredentials {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyBytes(),
    Buffer.from(stored.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(stored.tag, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(stored.data, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(plain.toString('utf8')) as ConnectorCredentials;
}

export function isEncryptedConnectorSecrets(value: unknown): value is EncryptedConnectorSecrets {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as EncryptedConnectorSecrets).enc === 1 &&
      typeof (value as EncryptedConnectorSecrets).data === 'string',
  );
}
