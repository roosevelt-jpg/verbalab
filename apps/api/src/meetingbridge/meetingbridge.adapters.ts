import { Injectable } from '@nestjs/common';
import { TranslateService } from '../translate/translate.service';

export type MeetingTranslateResult = {
  text: string;
  status: 'ready' | 'fixture' | 'unsupported';
  modelVersion: string;
};

@Injectable()
export class MeetingBridgeAdapters {
  constructor(private readonly translateService: TranslateService) {}

  async translateText(input: {
    text: string;
    sourceLang: string;
    targetLang: string;
    organizationId: string;
    workspaceId?: string;
  }): Promise<MeetingTranslateResult> {
    if (input.sourceLang === input.targetLang) {
      return { text: input.text, status: 'ready', modelVersion: 'identity' };
    }

    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT === '1';

    try {
      const result = await this.translateService.translate({
        text: input.text,
        source: input.sourceLang,
        target: input.targetLang,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId ?? '',
        skipReview: true,
      });
      return {
        text: result.text,
        status: 'ready',
        modelVersion: (result as { engine?: string }).engine ?? 'lugemi-mt',
      };
    } catch {
      if (!allowFixture) {
        return {
          text: '',
          status: 'unsupported',
          modelVersion: 'none',
        };
      }
      // Labeled fixture for tests / local demos only — never unmarked as production MT.
      return {
        text: `[fixture ${input.sourceLang}→${input.targetLang}] ${input.text}`,
        status: 'fixture',
        modelVersion: 'fixture-mt',
      };
    }
  }
}
