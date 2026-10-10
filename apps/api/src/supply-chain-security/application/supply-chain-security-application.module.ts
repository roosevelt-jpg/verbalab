import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SupplyChainSecurityModule } from '../supply-chain-security.module';
import { SUPPLY_CHAIN_SECURITY_CATALOG_PORT } from './ports';
import { NestSupplyChainSecurityCatalogAdapter } from './nest-supply-chain-security.adapter';
import { SUPPLY_CHAIN_SECURITY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, SupplyChainSecurityModule],
  providers: [
    NestSupplyChainSecurityCatalogAdapter,
    { provide: SUPPLY_CHAIN_SECURITY_CATALOG_PORT, useExisting: NestSupplyChainSecurityCatalogAdapter },
    ...SUPPLY_CHAIN_SECURITY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class SupplyChainSecurityApplicationModule {}
