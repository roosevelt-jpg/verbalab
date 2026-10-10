import { Injectable } from '@nestjs/common';
import { AccentsService } from '../../accents/accents.service';
import type { AccentPort, AccentRow } from './ports';

@Injectable()
export class NestAccentAdapter implements AccentPort {
  constructor(private readonly accents: AccentsService) {}

  async list(language?: string): Promise<AccentRow[]> {
    const res = await this.accents.list(language);
    return res.data.map((a) => ({
      code: a.code,
      languageCode: a.languageCode,
      nameEn: a.nameEn,
      region: a.region,
      relatedDialectCode: a.relatedDialectCode,
    }));
  }
}
