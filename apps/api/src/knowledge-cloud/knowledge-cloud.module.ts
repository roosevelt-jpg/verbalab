import { Module } from '@nestjs/common';
import { KnowledgeCloudController } from './knowledge-cloud.controller';
import { KnowledgeCloudService } from './knowledge-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [KnowledgeCloudController],
  providers: [KnowledgeCloudService],
  exports: [KnowledgeCloudService],
})
export class KnowledgeCloudModule {}
