import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { QualityService } from './quality.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import { Request } from 'express';

@Controller('v1/reviews')
@UseGuards(ClerkAuthGuard)
export class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Get()
  list(
    @CurrentSession() session: SessionContext,
    @Query('status') status?: string,
    @Query('needsReview') needsReviewRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const needsReview =
      needsReviewRaw === 'true' ? true : needsReviewRaw === 'false' ? false : undefined;
    const limit = limitRaw ? Number(limitRaw) : 50;
    return this.quality.list(session.organizationId, {
      status,
      needsReview,
      limit: Number.isFinite(limit) ? limit : 50,
    });
  }

  @Post(':id/accept')
  accept(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { note?: string; addToTm?: boolean },
  ) {
    return this.quality.accept({
      organizationId: session.organizationId,
      reviewId: id,
      userId: session.userId,
      note: body.note,
      addToTm: body.addToTm,
      ip: clientIp(req),
    });
  }

  @Post(':id/reject')
  reject(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.quality.reject({
      organizationId: session.organizationId,
      reviewId: id,
      userId: session.userId,
      note: body.note,
      ip: clientIp(req),
    });
  }
}
