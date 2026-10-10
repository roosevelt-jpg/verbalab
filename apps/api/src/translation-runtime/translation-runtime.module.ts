import { Module } from '@nestjs/common';
import { TranslationRuntimeController } from './translation-runtime.controller';
import { TranslationRuntimeService } from './translation-runtime.service';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [TranslateModule],
  controllers: [TranslationRuntimeController],
  providers: [TranslationRuntimeService],
  exports: [TranslationRuntimeService],
})
export class TranslationRuntimeModule {}
