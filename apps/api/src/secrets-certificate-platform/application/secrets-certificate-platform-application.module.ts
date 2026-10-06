import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SecretsCertificatePlatformModule } from '../secrets-certificate-platform.module';
import { SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT } from './ports';
import { NestSecretsCertificatePlatformCatalogAdapter } from './nest-secrets-certificate-platform.adapter';
import { SECRETS_CERTIFICATE_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, SecretsCertificatePlatformModule],
  providers: [
    NestSecretsCertificatePlatformCatalogAdapter,
    { provide: SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT, useExisting: NestSecretsCertificatePlatformCatalogAdapter },
    ...SECRETS_CERTIFICATE_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SecretsCertificatePlatformApplicationModule {}
