import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AgentopsPlatformModule } from '../agentops-platform.module';
import { AGENTOPS_PLATFORM_CATALOG_PORT } from './ports';
import { NestAgentopsPlatformCatalogAdapter } from './nest-agentops-platform.adapter';
import { AGENTOPS_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AgentopsPlatformModule],
  providers: [
    NestAgentopsPlatformCatalogAdapter,
    { provide: AGENTOPS_PLATFORM_CATALOG_PORT, useExisting: NestAgentopsPlatformCatalogAdapter },
    ...AGENTOPS_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AgentopsPlatformApplicationModule {}
