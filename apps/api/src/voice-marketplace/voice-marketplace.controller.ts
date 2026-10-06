import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { VoiceMarketplaceService } from './voice-marketplace.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-marketplace')
export class VoiceMarketplaceController {
  constructor(private readonly marketplace: VoiceMarketplaceService) {}

  private role(req: AuthedReq) {
    return req.sessionAuth?.role ?? 'owner';
  }

  @Get('engine')
  engine {
    return this.marketplace.engine;
  }

  @Get('language-packs')
  languagePacks {
    return this.marketplace.languagePacks;
  }

  @Get('listings')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('mine') mine?: string,
    @Query('kind') kind?: string,
  ) {
    if (mine === '1' || mine === 'true') {
      return this.marketplace.listMine(req.translateAuth.organizationId);
    }
    return this.marketplace.listPublished(req.translateAuth.organizationId, kind);
  }

  @Get('installs')
  @UseGuards(TranslateAuthGuard)
  installs(@Req req: AuthedReq) {
    return this.marketplace.listInstalls(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('sales')
  @UseGuards(TranslateAuthGuard)
  sales(@Req req: AuthedReq) {
    return this.marketplace.listSales(req.translateAuth.organizationId);
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.marketplace.analytics(req.translateAuth.organizationId);
  }

  @Post('listings')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  publish(
    @Req req: AuthedReq,
    @Body
    body: {
      title?: string;
      description?: string;
      kind?: string;
      sourceType?: string;
      sourceVoiceId?: string;
      voiceCloneId?: string;
      language?: string;
      gender?: string;
      licenseType?: string;
      licenseNotes?: string;
      rightsAttested?: boolean;
      celebrityClaim?: boolean;
      priceCents?: number;
      currency?: string;
      subscriptionInterval?: string | null;
      packMemberIds?: string[];
      languagePackId?: string;
    },
  ) {
    return this.marketplace.publish({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      ...body,
      ip: clientIp(req),
    });
  }

  @Post('listings/:id/install')
  @UseGuards(TranslateAuthGuard)
  install(@Req req: AuthedReq, @Param('id') id: string) {
    return this.marketplace.install({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      listingId: id,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      ip: clientIp(req),
    });
  }

  @Get('listings/:id/reviews')
  reviews(@Param('id') id: string) {
    return this.marketplace.listReviews(id);
  }

  @Post('listings/:id/reviews')
  @UseGuards(TranslateAuthGuard)
  review(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { rating?: number; body?: string },
  ) {
    return this.marketplace.upsertReview({
      organizationId: req.translateAuth.organizationId,
      listingId: id,
      userId: req.sessionAuth?.userId,
      rating: body.rating,
      body: body.body,
      ip: clientIp(req),
    });
  }

  @Delete('listings/:id')
  @UseGuards(TranslateAuthGuard)
  unpublish(@Req req: AuthedReq, @Param('id') id: string) {
    return this.marketplace.unpublish({
      organizationId: req.translateAuth.organizationId,
      listingId: id,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      ip: clientIp(req),
    });
  }
}
