import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PolicyFabricModule } from '../policy-fabric.module';
import { POLICY_FABRIC_CATALOG_PORT } from './ports';
import { NestPolicyFabricCatalogAdapter } from './nest-policy-fabric-catalog.adapter';
import { POLICY_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, PolicyFabricModule],
  providers: [
    NestPolicyFabricCatalogAdapter,
    {
      provide: POLICY_FABRIC_CATALOG_PORT,
      useExisting: NestPolicyFabricCatalogAdapter,
    },
    ...POLICY_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class PolicyFabricApplicationModule {}
