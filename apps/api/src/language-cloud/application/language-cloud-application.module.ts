import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LanguagesModule } from '../../languages/languages.module';
import { DialectsModule } from '../../dialects/dialects.module';
import { AccentsModule } from '../../accents/accents.module';
import { LocalesModule } from '../../locales/locales.module';
import { CountryPacksModule } from '../../country-packs/country-packs.module';
import { StyleModule } from '../../style/style.module';
import { GrammarModule } from '../../grammar/grammar.module';
import {
  ACCENT_PORT,
  DIALECT_PORT,
  GRAMMAR_PORT,
  LANGUAGE_REGISTRY_PORT,
  STYLE_PORT,
} from './ports';
import { NestLanguageRegistryAdapter } from './nest-language-registry.adapter';
import { NestDialectAdapter } from './nest-dialect.adapter';
import { NestAccentAdapter } from './nest-accent.adapter';
import { NestGrammarAdapter } from './nest-grammar.adapter';
import { NestStyleAdapter } from './nest-style.adapter';
import { LANGUAGE_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [
    CqrsModule,
    LanguagesModule,
    DialectsModule,
    AccentsModule,
    LocalesModule,
    CountryPacksModule,
    StyleModule,
    GrammarModule,
  ],
  providers: [
    NestLanguageRegistryAdapter,
    NestDialectAdapter,
    NestAccentAdapter,
    NestGrammarAdapter,
    NestStyleAdapter,
    { provide: LANGUAGE_REGISTRY_PORT, useExisting: NestLanguageRegistryAdapter },
    { provide: DIALECT_PORT, useExisting: NestDialectAdapter },
    { provide: ACCENT_PORT, useExisting: NestAccentAdapter },
    { provide: GRAMMAR_PORT, useExisting: NestGrammarAdapter },
    { provide: STYLE_PORT, useExisting: NestStyleAdapter },
    ...LANGUAGE_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class LanguageCloudApplicationModule {}
