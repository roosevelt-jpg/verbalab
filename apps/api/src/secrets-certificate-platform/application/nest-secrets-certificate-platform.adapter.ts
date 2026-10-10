import { Injectable } from '@nestjs/common';
import { SecretsCertificatePlatformService } from '../secrets-certificate-platform.service';
import {
  SecretsCertificatePlatformCatalogPort,
  SecretsCertificatePlatformEngineBundle,
  SecretsCertificatePlatformProductRow,
} from './ports';

@Injectable()
export class NestSecretsCertificatePlatformCatalogAdapter implements SecretsCertificatePlatformCatalogPort {
  constructor(private readonly service: SecretsCertificatePlatformService) {}

  engine(): SecretsCertificatePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): SecretsCertificatePlatformProductRow[] {
    const bundle = this.engine() as {
      products?: SecretsCertificatePlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/secrets-certificate-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'secrets-certificate-platform',
        name: 'Secrets & Certificate Platform',
        status: 'shipped',
        api: 'GET /v1/secrets-certificate-platform/engine',
        console: '/secrets-certificate-platform',
        notes: ' shipped.',
      },
    ];
  }
}
