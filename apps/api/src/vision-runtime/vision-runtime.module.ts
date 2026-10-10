import { Module } from '@nestjs/common';
import { VisionRuntimeController } from './vision-runtime.controller';
import { VisionRuntimeService } from './vision-runtime.service';
import { DocumentsModule } from '../documents/documents.module';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [DocumentsModule, OcrModule],
  controllers: [VisionRuntimeController],
  providers: [VisionRuntimeService],
  exports: [VisionRuntimeService],
})
export class VisionRuntimeModule {}
