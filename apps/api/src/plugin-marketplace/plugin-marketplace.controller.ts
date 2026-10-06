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
import { PluginMarketplaceService } from './plugin-marketplace.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/plugin-marketplace')
export class PluginMarketplaceController {
  constructor(private readonly marketplace: PluginMarketplaceService) {}

  private role(req: AuthedReq) {
    return req.sessionAuth?.role ?? 'owner';
  }

  @Get('engine')
  engine {
    return this.marketplace.engine;
  }

  @Get('products')
  products {
    return this.marketplace.engine;
  }

  @Get('monitoring')
  monitoring {
    return this.marketplace.monitoring;
  }

  @Get('listings')
  @UseGuards(TranslateAuthGuard)
  list(@Req req: AuthedReq, @Query('mine') mine?: string) {
    if (mine === '1' || mine === 'true') {
      return this.marketplace.listMine(req.translateAuth.organizationId);
    }
    return this.marketplace.listPublished(req.translateAuth.organizationId);
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
      pluginId?: string;
      title?: string;
      description?: string;
      priceCents?: number;
      currency?: string;
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

  @Post('listings/:id/update')
  @UseGuards(TranslateAuthGuard)
  update(@Req req: AuthedReq, @Param('id') id: string) {
    return this.marketplace.updateListing({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      listingId: id,
      ip: clientIp(req),
    });
  }

  @Post('listings/:id/install')
  @UseGuards(TranslateAuthGuard)
  install(@Req req: AuthedReq, @Param('id') id: string) {
    return this.marketplace.install({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      listingId: id,
      ip: clientIp(req),
    });
  }

  @Post('listings/:id/run')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  run(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body
    body: { actions?: Array<{ action: string; input?: Record<string, unknown> }> },
  ) {
    return this.marketplace.run({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      listingId: id,
      actions: body.actions,
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
      workspaceId: req.translateAuth.workspaceId,
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
