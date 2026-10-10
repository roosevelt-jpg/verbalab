import { Module } from '@nestjs/common';
import { KnowledgeOperatingSystemController } from './knowledge-operating-system.controller';
import { KnowledgeOperatingSystemService } from './knowledge-operating-system.service';
import { KnowledgeRuntimeModule } from '../knowledge-runtime/knowledge-runtime.module';
import { KnowledgeFabricModule } from '../knowledge-fabric/knowledge-fabric.module';
import { KnowledgeCloudModule } from '../knowledge-cloud/knowledge-cloud.module';
import { AfricanKnowledgeGraphModule } from '../african-knowledge-graph/african-knowledge-graph.module';

@Module({
  imports: [KnowledgeRuntimeModule, KnowledgeFabricModule, KnowledgeCloudModule, AfricanKnowledgeGraphModule],
  controllers: [KnowledgeOperatingSystemController],
  providers: [KnowledgeOperatingSystemService],
  exports: [KnowledgeOperatingSystemService],
})
export class KnowledgeOperatingSystemModule {}
