import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalDeploymentControllerModule } from '../global-deployment-controller.module';
import { GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT } from './ports';
import { NestGlobalDeploymentControllerCatalogAdapter } from './nest-global-deployment-controller.adapter';
import { GLOBAL_DEPLOYMENT_CONTROLLER_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalDeploymentControllerModule],
  providers: [
    NestGlobalDeploymentControllerCatalogAdapter,
    { provide: GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT, useExisting: NestGlobalDeploymentControllerCatalogAdapter },
    ...GLOBAL_DEPLOYMENT_CONTROLLER_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalDeploymentControllerApplicationModule {}
