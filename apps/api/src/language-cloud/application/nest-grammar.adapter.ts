import { Injectable } from '@nestjs/common';
import { GrammarService } from '../../grammar/grammar.service';
import type { AuthContext, GrammarCheckResult, GrammarPort } from './ports';

@Injectable
export class NestGrammarAdapter implements GrammarPort {
  constructor(private readonly grammar: GrammarService) {}

  async check(
    input: { text: string; language?: string } & AuthContext,
  ): Promise<GrammarCheckResult> {
    const result = await this.grammar.check({
      text: input.text,
      language: input.language,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });
    return {
      language: result.language,
      corrected: result.corrected,
      changed: result.changed,
      issueCount: result.issueCount,
      provider: result.provider,
      note: result.note,
      issues: result.issues.map((i) => ({
        type: i.type,
        severity: i.severity,
        message: i.message,
        suggestion: i.suggestion ?? null,
      })),
    };
  }
}
