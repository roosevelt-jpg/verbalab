import { Module } from '@nestjs/common';
import { GlobalDeploymentControllerController } from './global-deployment-controller.controller';
import { GlobalDeploymentControllerService } from './global-deployment-controller.service';

@Module({
  controllers: [GlobalDeploymentControllerController],
  providers: [GlobalDeploymentControllerService],
  exports: [GlobalDeploymentControllerService],
})
export class GlobalDeploymentControllerModule {}
