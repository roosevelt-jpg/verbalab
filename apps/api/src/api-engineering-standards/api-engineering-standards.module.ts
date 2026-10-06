import { Module } from '@nestjs/common';
import { ApiEngineeringStandardsController } from './api-engineering-standards.controller';
import { ApiEngineeringStandardsService } from './api-engineering-standards.service';
import { DeveloperCloudModule } from '../developer-cloud/developer-cloud.module';
import { DeveloperExperiencePlatformModule } from '../developer-experience-platform/developer-experience-platform.module';

@Module({
  imports: [DeveloperCloudModule, DeveloperExperiencePlatformModule],
  controllers: [ApiEngineeringStandardsController],
  providers: [ApiEngineeringStandardsService],
  exports: [ApiEngineeringStandardsService],
})
export class ApiEngineeringStandardsModule {}
