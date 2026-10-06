import { Module } from '@nestjs/common';
import { AfricanLanguageRegistryController } from './african-language-registry.controller';
import { AfricanLanguageRegistryService } from './african-language-registry.service';

@Module({
  controllers: [AfricanLanguageRegistryController],
  providers: [AfricanLanguageRegistryService],
  exports: [AfricanLanguageRegistryService],
})
export class AfricanLanguageRegistryModule {}
