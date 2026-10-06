import { Injectable } from '@nestjs/common';
import { StyleService } from '../../style/style.service';
import type { AuthContext, StylePort, StyleRewriteResult } from './ports';

@Injectable
export class NestStyleAdapter implements StylePort {
  constructor(private readonly style: StyleService) {}

  async rewrite(
    input: { text: string; profile: string; language?: string } & AuthContext,
  ): Promise<StyleRewriteResult> {
    const result = await this.style.rewrite({
      text: input.text,
      profile: input.profile,
      language: input.language,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });
    return {
      profile: result.profile,
      rewritten: result.rewritten,
      changed: result.changed,
      changeCount: result.changeCount,
      provider: result.provider,
      note: result.note,
    };
  }
}
