import { Module } from '@nestjs/common';
import { AfricanKnowledgeGraphController } from './african-knowledge-graph.controller';
import { AfricanKnowledgeGraphService } from './african-knowledge-graph.service';

@Module({
  controllers: [AfricanKnowledgeGraphController],
  providers: [AfricanKnowledgeGraphService],
  exports: [AfricanKnowledgeGraphService],
})
export class AfricanKnowledgeGraphModule {}
