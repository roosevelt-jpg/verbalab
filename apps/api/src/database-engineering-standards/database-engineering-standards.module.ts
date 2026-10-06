import { Module } from '@nestjs/common';
import { DatabaseEngineeringStandardsController } from './database-engineering-standards.controller';
import { DatabaseEngineeringStandardsService } from './database-engineering-standards.service';
import { KnowledgeCloudModule } from '../knowledge-cloud/knowledge-cloud.module';
import { VectorCloudModule } from '../vector-cloud/vector-cloud.module';
import { EmbeddingRuntimeModule } from '../embedding-runtime/embedding-runtime.module';

@Module({
  imports: [KnowledgeCloudModule, VectorCloudModule, EmbeddingRuntimeModule],
  controllers: [DatabaseEngineeringStandardsController],
  providers: [DatabaseEngineeringStandardsService],
  exports: [DatabaseEngineeringStandardsService],
})
export class DatabaseEngineeringStandardsModule {}
