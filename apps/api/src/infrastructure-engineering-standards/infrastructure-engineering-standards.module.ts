import { Module } from '@nestjs/common';
import { InfrastructureEngineeringStandardsController } from './infrastructure-engineering-standards.controller';
import { InfrastructureEngineeringStandardsService } from './infrastructure-engineering-standards.service';
import { FinopsPlatformModule } from '../finops-platform/finops-platform.module';
import { SecretsCertificatePlatformModule } from '../secrets-certificate-platform/secrets-certificate-platform.module';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';
import { GitopsPlatformModule } from '../gitops-platform/gitops-platform.module';
import { GlobalDeploymentControllerModule } from '../global-deployment-controller/global-deployment-controller.module';

@Module({
  imports: [FinopsPlatformModule, SecretsCertificatePlatformModule, GpuPlatformModule, GitopsPlatformModule, GlobalDeploymentControllerModule],
  controllers: [InfrastructureEngineeringStandardsController],
  providers: [InfrastructureEngineeringStandardsService],
  exports: [InfrastructureEngineeringStandardsService],
})
export class InfrastructureEngineeringStandardsModule {}
