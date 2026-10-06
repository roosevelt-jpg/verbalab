import type { AuthContext } from './ports';

export class DetectDialectCommand {
  constructor(
    public readonly text: string,
    public readonly language: string | undefined,
    public readonly auth: AuthContext,
  ) {}
}

export class CheckGrammarCommand {
  constructor(
    public readonly text: string,
    public readonly language: string | undefined,
    public readonly auth: AuthContext,
  ) {}
}

export class RewriteStyleCommand {
  constructor(
    public readonly text: string,
    public readonly profile: string,
    public readonly language: string | undefined,
    public readonly auth: AuthContext,
  ) {}
}

export class ListLanguagesQuery {}

export class ListDialectsQuery {
  constructor(public readonly language?: string) {}
}

export class ListAccentsQuery {
  constructor(public readonly language?: string) {}
}

export class ListLocalePacksQuery {}

export class ListCountryPacksQuery {
  constructor(public readonly region?: string) {}
}

export class ListStyleProfilesQuery {}

export class ListLanguageProductsQuery {}
