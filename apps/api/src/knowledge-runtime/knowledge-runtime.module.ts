import { Module } from '@nestjs/common';
import { KnowledgeRuntimeController } from './knowledge-runtime.controller';
import { KnowledgeRuntimeService } from './knowledge-runtime.service';
import { KnowledgeCloudModule } from '../knowledge-cloud/knowledge-cloud.module';

@Module({
  imports: [KnowledgeCloudModule],
  controllers: [KnowledgeRuntimeController],
  providers: [KnowledgeRuntimeService],
  exports: [KnowledgeRuntimeService],
})
export class KnowledgeRuntimeModule {}
