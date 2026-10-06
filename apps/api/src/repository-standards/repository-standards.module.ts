import { Module } from '@nestjs/common';
import { RepositoryStandardsController } from './repository-standards.controller';
import { RepositoryStandardsService } from './repository-standards.service';
import { DeveloperExperiencePlatformModule } from '../developer-experience-platform/developer-experience-platform.module';
import { GoldenPathPlatformModule } from '../golden-path-platform/golden-path-platform.module';
import { GitopsPlatformModule } from '../gitops-platform/gitops-platform.module';

@Module({
  imports: [DeveloperExperiencePlatformModule, GoldenPathPlatformModule, GitopsPlatformModule],
  controllers: [RepositoryStandardsController],
  providers: [RepositoryStandardsService],
  exports: [RepositoryStandardsService],
})
export class RepositoryStandardsModule {}
