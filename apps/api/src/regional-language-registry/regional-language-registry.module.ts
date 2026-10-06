import { Module } from '@nestjs/common';
import { RegionalLanguageRegistryController } from './regional-language-registry.controller';
import { RegionalLanguageRegistryService } from './regional-language-registry.service';

@Module({
  controllers: [RegionalLanguageRegistryController],
  providers: [RegionalLanguageRegistryService],
  exports: [RegionalLanguageRegistryService],
})
export class RegionalLanguageRegistryModule {}
