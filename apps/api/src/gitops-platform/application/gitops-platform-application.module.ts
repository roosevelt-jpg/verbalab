import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GitopsPlatformModule } from '../gitops-platform.module';
import { GITOPS_PLATFORM_CATALOG_PORT } from './ports';
import { NestGitopsPlatformCatalogAdapter } from './nest-gitops-platform.adapter';
import { GITOPS_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GitopsPlatformModule],
  providers: [
    NestGitopsPlatformCatalogAdapter,
    { provide: GITOPS_PLATFORM_CATALOG_PORT, useExisting: NestGitopsPlatformCatalogAdapter },
    ...GITOPS_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GitopsPlatformApplicationModule {}
