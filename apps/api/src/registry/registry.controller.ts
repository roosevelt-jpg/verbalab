import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LinguisticRuleKind, WritingSystemKind } from '@prisma/client';
import { RegistryService, RegistryValidateInput } from './registry.service';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';

@Controller('v1/registry')
export class RegistryController {
  constructor(private readonly registry: RegistryService) {}

  @Get()
  overview() {
    return this.registry.overview();
  }

  @Get('families')
  async families() {
    const rows = await this.registry.listFamilies();
    return {
      data: rows.map((f) => ({
        code: f.code,
        nameEn: f.nameEn,
        parentCode: f.parentCode,
        notes: f.notes,
      })),
    };
  }

  @Get('families/:code')
  family(@Param('code') code: string) {
    return this.registry.getFamily(code);
  }

  @Get('writing-systems')
  async writingSystems(@Query('kind') kind?: string) {
    return this.listScripts(kind);
  }

  @Get('scripts')
  async scripts(@Query('kind') kind?: string) {
    return this.listScripts(kind);
  }

  @Get('alphabets')
  async alphabets() {
    const rows = await this.registry.listWritingSystems(WritingSystemKind.alphabet);
    return { data: rows.map(mapScript), note: 'Writing systems with kind=alphabet (ISO 15924 subset).' };
  }

  @Get('writing-systems/:code')
  writingSystem(@Param('code') code: string) {
    return this.registry.getWritingSystem(code);
  }

  @Get('scripts/:code')
  script(@Param('code') code: string) {
    return this.registry.getWritingSystem(code);
  }

  @Get('rules')
  async rules(@Query('kind') kind?: string, @Query('language') language?: string) {
    const parsed = parseRuleKind(kind);
    const rows = await this.registry.listRules({
      kind: parsed,
      language: language?.trim() || undefined,
    });
    return {
      data: rows.map((r) => ({
        code: r.code,
        kind: r.kind,
        languageCode: r.languageCode,
        nameEn: r.nameEn,
        description: r.description,
        pattern: r.pattern,
        examples: r.examples,
        notes: r.notes,
      })),
    };
  }

  @Get('rules/:code')
  rule(@Param('code') code: string) {
    return this.registry.getRule(code);
  }

  @Post('validate')
  @HttpCode(200)
  validate(@Body() body: RegistryValidateInput) {
    return this.registry.validate(body ?? {});
  }

  @Get('analytics')
  analytics() {
    return this.registry.analytics();
  }

  @Get('health')
  health() {
    return this.registry.health();
  }

  private async listScripts(kind?: string) {
    const parsed = parseWritingKind(kind);
    const rows = await this.registry.listWritingSystems(parsed);
    return { data: rows.map(mapScript) };
  }
}

function mapScript(s: {
  code: string;
  nameEn: string;
  kind: WritingSystemKind;
  rtl: boolean;
  sampleChars: string | null;
  notes: string | null;
}) {
  return {
    code: s.code,
    nameEn: s.nameEn,
    kind: s.kind,
    rtl: s.rtl,
    sampleChars: s.sampleChars,
    notes: s.notes,
    isAlphabet: s.kind === WritingSystemKind.alphabet,
    isWritingSystem: true,
    isScript: true,
  };
}

function parseWritingKind(kind?: string): WritingSystemKind | undefined {
  if (!kind?.trim()) return undefined;
  const k = kind.trim().toLowerCase();
  if (!(k in WritingSystemKind)) {
    throw new ApiException(
      'invalid_argument',
      `Unknown writing system kind "${kind}". Use alphabet|abjad|abugida|syllabary|logographic|other.`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return k as WritingSystemKind;
}

function parseRuleKind(kind?: string): LinguisticRuleKind | undefined {
  if (!kind?.trim()) return undefined;
  const k = kind.trim().toLowerCase();
  if (!(k in LinguisticRuleKind)) {
    throw new ApiException(
      'invalid_argument',
      `Unknown rule kind "${kind}". Use pronunciation|grammar|phonetic|morphology.`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return k as LinguisticRuleKind;
}
