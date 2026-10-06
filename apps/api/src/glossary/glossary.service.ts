import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import {
  GlossaryTermLike,
  enforceGlossaryTargets,
  protectGlossaryTerms,
  restoreGlossaryPlaceholders,
} from './glossary-apply';

@Injectable()
export class GlossaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, workspaceId: string, pair?: { source?: string; target?: string }) {
    return this.prisma.glossaryTerm.findMany({
      where: {
        organizationId,
        workspaceId,
        ...(pair?.source ? { sourceLang: pair.source } : {}),
        ...(pair?.target ? { targetLang: pair.target } : {}),
      },
      orderBy: [{ sourceLang: 'asc' }, { targetLang: 'asc' }, { sourceTerm: 'asc' }],
    });
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    sourceLang: string;
    targetLang: string;
    sourceTerm: string;
    targetTerm: string;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    ip?: string;
  }) {
    const sourceTerm = input.sourceTerm.trim();
    const targetTerm = input.targetTerm.trim();
    if (!sourceTerm || !targetTerm) {
      throw new ApiException(
        'validation_error',
        'sourceTerm and targetTerm are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ApiException(
        'validation_error',
        'sourceLang and targetLang are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const term = await this.prisma.glossaryTerm.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          sourceTerm,
          targetTerm,
          caseSensitive: input.caseSensitive ?? false,
          wholeWord: input.wholeWord ?? true,
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'glossary.term_created',
        route: 'POST /v1/glossary/terms',
        ip: input.ip,
        metadata: { termId: term.id, sourceTerm, targetTerm },
      });
      return term;
    } catch {
      throw new ApiException(
        'conflict',
        'A term with this source already exists for the language pair',
        HttpStatus.CONFLICT,
      );
    }
  }

  async update(
    organizationId: string,
    termId: string,
    patch: {
      sourceTerm?: string;
      targetTerm?: string;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      userId?: string;
      ip?: string;
    },
  ) {
    const existing = await this.prisma.glossaryTerm.findFirst({
      where: { id: termId, organizationId },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Glossary term not found', HttpStatus.NOT_FOUND);
    }

    const term = await this.prisma.glossaryTerm.update({
      where: { id: termId },
      data: {
        ...(patch.sourceTerm !== undefined ? { sourceTerm: patch.sourceTerm.trim() } : {}),
        ...(patch.targetTerm !== undefined ? { targetTerm: patch.targetTerm.trim() } : {}),
        ...(patch.caseSensitive !== undefined ? { caseSensitive: patch.caseSensitive } : {}),
        ...(patch.wholeWord !== undefined ? { wholeWord: patch.wholeWord } : {}),
      },
    });

    await this.audit.record({
      organizationId,
      userId: patch.userId,
      action: 'glossary.term_updated',
      route: 'PATCH /v1/glossary/terms/:id',
      ip: patch.ip,
      metadata: { termId },
    });
    return term;
  }

  async remove(organizationId: string, termId: string, meta?: { userId?: string; ip?: string }) {
    const existing = await this.prisma.glossaryTerm.findFirst({
      where: { id: termId, organizationId },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Glossary term not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.glossaryTerm.delete({ where: { id: termId } });
    await this.audit.record({
      organizationId,
      userId: meta?.userId,
      action: 'glossary.term_deleted',
      route: 'DELETE /v1/glossary/terms/:id',
      ip: meta?.ip,
      metadata: { termId },
    });
    return { id: termId, deleted: true };
  }

  async applyForPair(input: {
    workspaceId: string;
    organizationId: string;
    source: string;
    target: string;
    text: string;
  }) {
    const terms = await this.prisma.glossaryTerm.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        sourceLang: input.source,
        targetLang: input.target,
      },
    });
    if (terms.length === 0) {
      return {
        text: input.text,
        applied: 0,
        terms: [] as GlossaryTermLike[],
        replacements: [] as Array<{ placeholder: string; targetTerm: string; sourceTerm: string }>,
      };
    }
    const protectedText = protectGlossaryTerms(input.text, terms);
    return {
      text: protectedText.text,
      applied: protectedText.replacements.length,
      terms,
      replacements: protectedText.replacements,
    };
  }

  finalizeTranslation(input: {
    translated: string;
    terms: GlossaryTermLike[];
    replacements: Array<{ placeholder: string; targetTerm: string; sourceTerm: string }>;
  }) {
    let text = restoreGlossaryPlaceholders(input.translated, input.replacements);
    text = enforceGlossaryTargets(text, input.terms);
    return text;
  }
}
