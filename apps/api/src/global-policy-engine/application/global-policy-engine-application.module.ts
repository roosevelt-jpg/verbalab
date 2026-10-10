import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalPolicyEngineModule } from '../global-policy-engine.module';
import { GLOBAL_POLICY_ENGINE_CATALOG_PORT } from './ports';
import { NestGlobalPolicyEngineCatalogAdapter } from './nest-global-policy-engine.adapter';
import { GLOBAL_POLICY_ENGINE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalPolicyEngineModule],
  providers: [
    NestGlobalPolicyEngineCatalogAdapter,
    { provide: GLOBAL_POLICY_ENGINE_CATALOG_PORT, useExisting: NestGlobalPolicyEngineCatalogAdapter },
    ...GLOBAL_POLICY_ENGINE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalPolicyEngineApplicationModule {}
