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
import { MarketplaceService } from './marketplace.service';
import { BillingService } from '../billing/billing.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/marketplace')
@UseGuards(ClerkAuthGuard)
export class MarketplaceController {
  constructor(
    private readonly marketplace: MarketplaceService,
    private readonly billing: BillingService,
  ) {}

  @Get('listings')
  list(
    @CurrentSession() session: SessionContext,
    @Query('mine') mine?: string,
    @Query('kind') kind?: string,
  ) {
    if (mine === '1' || mine === 'true') {
      return this.marketplace.listMine(session.organizationId, kind);
    }
    return this.marketplace.listPublished(session.organizationId, kind);
  }

  @Get('installs')
  installs(@CurrentSession() session: SessionContext) {
    return this.marketplace.listInstalls(session.organizationId, session.workspaceId);
  }

  @Get('sales')
  sales(@CurrentSession() session: SessionContext) {
    return this.marketplace.listSales(session.organizationId);
  }

  @Get('connect/status')
  connectStatus(@CurrentSession() session: SessionContext) {
    return this.billing.getConnectStatus(session.organizationId);
  }

  @Post('connect/onboard')
  connectOnboard(@CurrentSession() session: SessionContext, @Req() req: Request) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.billing.createConnectOnboardingLink({
      organizationId: session.organizationId,
      userId: session.userId,
      ip: req.ip,
    });
  }

  @Post('listings')
  @HttpCode(HttpStatus.CREATED)
  publish(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      title?: string;
      description?: string;
      kind?: string;
      priceCents?: number;
      currency?: string;
    },
    @Req() req: Request,
  ) {
    return this.marketplace.publish({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      title: body.title ?? '',
      description: body.description,
      kind: body.kind,
      priceCents: body.priceCents,
      currency: body.currency,
      ip: req.ip,
    });
  }

  @Post('listings/:id/install')
  install(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.marketplace.install({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      listingId: id,
      userId: session.userId,
      role: session.role,
      ip: req.ip,
    });
  }

  @Delete('listings/:id')
  unpublish(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.marketplace.unpublish({
      organizationId: session.organizationId,
      listingId: id,
      userId: session.userId,
      role: session.role,
      ip: req.ip,
    });
  }
}
