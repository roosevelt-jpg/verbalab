import { Injectable } from '@nestjs/common';
import { DialectsService } from '../../dialects/dialects.service';
import type { AuthContext, DialectDetectResult, DialectPort, DialectRow } from './ports';

@Injectable()
export class NestDialectAdapter implements DialectPort {
  constructor(private readonly dialects: DialectsService) {}

  async list(language?: string): Promise<DialectRow[]> {
    const res = await this.dialects.list(language);
    return res.data.map((d) => ({
      code: d.code,
      languageCode: d.languageCode,
      nameEn: d.nameEn,
      region: d.region,
      cueTerms: d.cueTerms,
    }));
  }

  async detect(
    input: { text: string; language?: string } & AuthContext,
  ): Promise<DialectDetectResult> {
    const result = await this.dialects.detect({
      text: input.text,
      language: input.language,
      organizationId: input.organizationId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });
    return {
      language: result.language,
      dialect: result.dialect,
      dialectName: result.dialectName,
      confidence: result.confidence,
      provider: result.provider,
      note: result.note,
    };
  }
}
