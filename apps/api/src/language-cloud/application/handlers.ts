import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ACCENT_PORT,
  AccentPort,
  DIALECT_PORT,
  DialectPort,
  GRAMMAR_PORT,
  GrammarPort,
  LANGUAGE_REGISTRY_PORT,
  LanguageRegistryPort,
  STYLE_PORT,
  StylePort,
} from './ports';
import {
  CheckGrammarCommand,
  DetectDialectCommand,
  ListAccentsQuery,
  ListCountryPacksQuery,
  ListDialectsQuery,
  ListLanguageProductsQuery,
  ListLanguagesQuery,
  ListLocalePacksQuery,
  ListStyleProfilesQuery,
  RewriteStyleCommand,
} from './messages';

@Injectable()
@CommandHandler(DetectDialectCommand)
export class DetectDialectHandler implements ICommandHandler<DetectDialectCommand> {
  constructor(@Inject(DIALECT_PORT) private readonly dialects: DialectPort) {}

  execute(command: DetectDialectCommand) {
    return this.dialects.detect({
      text: command.text,
      language: command.language,
      ...command.auth,
    });
  }
}

@Injectable()
@CommandHandler(CheckGrammarCommand)
export class CheckGrammarHandler implements ICommandHandler<CheckGrammarCommand> {
  constructor(@Inject(GRAMMAR_PORT) private readonly grammar: GrammarPort) {}

  execute(command: CheckGrammarCommand) {
    return this.grammar.check({
      text: command.text,
      language: command.language,
      ...command.auth,
    });
  }
}

@Injectable()
@CommandHandler(RewriteStyleCommand)
export class RewriteStyleHandler implements ICommandHandler<RewriteStyleCommand> {
  constructor(@Inject(STYLE_PORT) private readonly style: StylePort) {}

  execute(command: RewriteStyleCommand) {
    return this.style.rewrite({
      text: command.text,
      profile: command.profile,
      language: command.language,
      ...command.auth,
    });
  }
}

@Injectable()
@QueryHandler(ListLanguagesQuery)
export class ListLanguagesHandler implements IQueryHandler<ListLanguagesQuery> {
  constructor(@Inject(LANGUAGE_REGISTRY_PORT) private readonly registry: LanguageRegistryPort) {}

  execute() {
    return this.registry.listLanguages();
  }
}

@Injectable()
@QueryHandler(ListDialectsQuery)
export class ListDialectsHandler implements IQueryHandler<ListDialectsQuery> {
  constructor(@Inject(DIALECT_PORT) private readonly dialects: DialectPort) {}

  execute(query: ListDialectsQuery) {
    return this.dialects.list(query.language);
  }
}

@Injectable()
@QueryHandler(ListAccentsQuery)
export class ListAccentsHandler implements IQueryHandler<ListAccentsQuery> {
  constructor(@Inject(ACCENT_PORT) private readonly accents: AccentPort) {}

  execute(query: ListAccentsQuery) {
    return this.accents.list(query.language);
  }
}

@Injectable()
@QueryHandler(ListLocalePacksQuery)
export class ListLocalePacksHandler implements IQueryHandler<ListLocalePacksQuery> {
  constructor(@Inject(LANGUAGE_REGISTRY_PORT) private readonly registry: LanguageRegistryPort) {}

  execute() {
    return this.registry.listLocalePacks();
  }
}

@Injectable()
@QueryHandler(ListCountryPacksQuery)
export class ListCountryPacksHandler implements IQueryHandler<ListCountryPacksQuery> {
  constructor(@Inject(LANGUAGE_REGISTRY_PORT) private readonly registry: LanguageRegistryPort) {}

  execute(query: ListCountryPacksQuery) {
    return this.registry.listCountryPacks(query.region);
  }
}

@Injectable()
@QueryHandler(ListStyleProfilesQuery)
export class ListStyleProfilesHandler implements IQueryHandler<ListStyleProfilesQuery> {
  constructor(@Inject(LANGUAGE_REGISTRY_PORT) private readonly registry: LanguageRegistryPort) {}

  execute() {
    return this.registry.listStyleProfiles();
  }
}

@Injectable()
@QueryHandler(ListLanguageProductsQuery)
export class ListLanguageProductsHandler implements IQueryHandler<ListLanguageProductsQuery> {
  constructor(@Inject(LANGUAGE_REGISTRY_PORT) private readonly registry: LanguageRegistryPort) {}

  execute() {
    return this.registry.listLanguageProducts();
  }
}

export const LANGUAGE_CLOUD_HANDLERS = [
  DetectDialectHandler,
  CheckGrammarHandler,
  RewriteStyleHandler,
  ListLanguagesHandler,
  ListDialectsHandler,
  ListAccentsHandler,
  ListLocalePacksHandler,
  ListCountryPacksHandler,
  ListStyleProfilesHandler,
  ListLanguageProductsHandler,
];
