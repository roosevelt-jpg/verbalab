import { Module } from '@nestjs/common';
import { LanguageCloudController } from './language-cloud.controller';
import { LanguageCloudService } from './language-cloud.service';
import { LanguagesModule } from '../languages/languages.module';
import { LocalesModule } from '../locales/locales.module';
import { EvalModule } from '../eval/eval.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [LanguagesModule, LocalesModule, EvalModule, IdentityModule],
  controllers: [LanguageCloudController],
  providers: [LanguageCloudService],
  exports: [LanguageCloudService],
})
export class LanguageCloudModule {}
