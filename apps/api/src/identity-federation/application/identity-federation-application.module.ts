import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IdentityFederationModule } from '../identity-federation.module';
import { IDENTITY_FEDERATION_CATALOG_PORT } from './ports';
import { NestIdentityFederationCatalogAdapter } from './nest-identity-federation.adapter';
import { IDENTITY_FEDERATION_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, IdentityFederationModule],
  providers: [
    NestIdentityFederationCatalogAdapter,
    { provide: IDENTITY_FEDERATION_CATALOG_PORT, useExisting: NestIdentityFederationCatalogAdapter },
    ...IDENTITY_FEDERATION_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class IdentityFederationApplicationModule {}
