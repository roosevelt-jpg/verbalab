import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { SpeechReviewService } from './speech-review.service';

@Controller('v1/speech-review')
export class SpeechReviewController {
  constructor(private readonly reviews: SpeechReviewService) {}

  @Get()
  @UseGuards(PlatformAdminGuard)
  list(@Query('locale') locale?: string) {
    return this.reviews.list(locale);
  }

  @Get('approved')
  @UseGuards(PlatformAdminGuard)
  approved() {
    return this.reviews.approvedCatalogue();
  }

  @Post()
  @UseGuards(PlatformAdminGuard)
  submit(
    @Body()
    body: {
      sourceScript?: string;
      targetTranslation?: string;
      locale?: string;
      voiceId?: string;
      modelVersion?: string;
      synthEngine?: string;
      audioBase64?: string;
      ratings?: {
        intelligibility?: number;
        naturalness?: number;
        accentAuthenticity?: number;
        audioQuality?: number;
      };
      pronunciationNotes?: string;
      meaningNotes?: string;
      reviewerId?: string;
      reviewerQualifications?: string[];
      decision?: 'approved' | 'rejected' | 'needs_adjudication';
    },
  ) {
    const clamp = (n: unknown) => Math.max(1, Math.min(5, Number(n) || 1));
    return this.reviews.submit({
      sourceScript: String(body.sourceScript ?? '').trim() || '(empty)',
      targetTranslation: body.targetTranslation,
      locale: String(body.locale ?? 'und'),
      voiceId: String(body.voiceId ?? 'own:unknown'),
      modelVersion: String(body.modelVersion ?? 'unknown'),
      synthEngine: String(body.synthEngine ?? 'unknown'),
      audioBase64: body.audioBase64,
      ratings: {
        intelligibility: clamp(body.ratings?.intelligibility),
        naturalness: clamp(body.ratings?.naturalness),
        accentAuthenticity: clamp(body.ratings?.accentAuthenticity),
        audioQuality: clamp(body.ratings?.audioQuality),
      },
      pronunciationNotes: body.pronunciationNotes,
      meaningNotes: body.meaningNotes,
      reviewerId: String(body.reviewerId ?? 'anonymous'),
      reviewerQualifications: body.reviewerQualifications ?? [],
      decision: body.decision ?? 'needs_adjudication',
    });
  }
}
