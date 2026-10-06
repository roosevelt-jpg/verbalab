import { Injectable, Logger } from '@nestjs/common';
import {
  listAccessAudit,
  listSecretEnvelopes,
  secretsCertificatePlatformEngineCatalog,
  toSecretMetadata,
} from './secrets-certificate-platform.catalog';

@Injectable()
export class SecretsCertificatePlatformService {
  private readonly logger = new Logger(SecretsCertificatePlatformService.name);

  engine() {
    // Never log plaintext — only metadata counts.
    this.logger.log(
      `secrets engine catalog: ${listSecretEnvelopes().length} metadata rows (plaintext omitted)`,
    );
    return secretsCertificatePlatformEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const secrets = catalog.secrets.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      secrets,
      count: secrets.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Metadata-only list — strips any accidental plaintext fields. */
  metadata(query?: string) {
    const q = (query ?? '').trim().toLowerCase();
    const secrets = listSecretEnvelopes()
      .map(toSecretMetadata)
      .filter((row) => {
        if (!q) return true;
        return JSON.stringify(row).toLowerCase().includes(q);
      });
    return {
      secrets,
      count: secrets.length,
      fields: ['id', 'name', 'version', 'rotatedAt', 'kind', 'status', 'encryptedAtRest', 'notes'],
      honesty: this.engine().honesty,
      note: 'Secret metadata only — never plaintext values.',
      docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    };
  }

  audit() {
    return {
      accessAuditing: true,
      entries: listAccessAudit(),
      count: listAccessAudit().length,
      honesty: this.engine().honesty,
      note: 'Access audit trail for secrets/certificate catalog operations.',
      docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'secrets-certificate-platform',
      secretCount: catalog.secrets.length,
      auditCount: catalog.accessAudit.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Secrets & Certificate Platform monitoring snapshot (VL-320).',
    };
  }
}
