import { Module } from '@nestjs/common';
import { EmbeddingRuntimeController } from './embedding-runtime.controller';
import { EmbeddingRuntimeService } from './embedding-runtime.service';
import { EmbeddingCloudModule } from '../embedding-cloud/embedding-cloud.module';

@Module({
  imports: [EmbeddingCloudModule],
  controllers: [EmbeddingRuntimeController],
  providers: [EmbeddingRuntimeService],
  exports: [EmbeddingRuntimeService],
})
export class EmbeddingRuntimeModule {}
