import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreatorEconomyService } from './creator-economy.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/creator-economy')
export class CreatorEconomyController {
  constructor(private readonly economy: CreatorEconomyService) {}

  private role(req: AuthedReq) {
    return req.sessionAuth?.role ?? 'owner';
  }

  @Get('engine')
  engine() {
    return this.economy.engine();
  }

  @Get('products')
  products() {
    return this.economy.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.economy.monitoring();
  }

  @Get('royalty/scenarios')
  royaltyScenarios() {
    return this.economy.royaltyScenarios();
  }

  @Post('royalty/preview')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  royaltyPreview(
    @Req() req: AuthedReq,
    @Body()
    body: {
      amountCents?: number;
      feeBps?: number;
      schedule?: 'ecosystem_hub' | 'content_marketplace';
    },
  ) {
    return this.economy.previewRoyalty({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      role: this.role(req),
      ...body,
      ip: clientIp(req),
    });
  }

  @Get('sales')
  @UseGuards(TranslateAuthGuard)
  sales(@Req() req: AuthedReq) {
    return this.economy.listSales(req.translateAuth.organizationId);
  }

  @Get('invoices')
  @UseGuards(TranslateAuthGuard)
  invoices(@Req() req: AuthedReq) {
    return this.economy.listInvoices(req.translateAuth.organizationId);
  }

  @Get('profiles/creator')
  @UseGuards(TranslateAuthGuard)
  creatorProfile(@Req() req: AuthedReq) {
    return this.economy.creatorProfile(req.translateAuth.organizationId);
  }

  @Get('profiles/organization')
  @UseGuards(TranslateAuthGuard)
  organizationProfile(@Req() req: AuthedReq) {
    return this.economy.organizationProfile(req.translateAuth.organizationId);
  }

  @Get('profiles/partner')
  @UseGuards(TranslateAuthGuard)
  partnerProfile(@Req() req: AuthedReq) {
    return this.economy.partnerProfile(req.translateAuth.organizationId);
  }

  @Get('licensing')
  @UseGuards(TranslateAuthGuard)
  licensing(@Req() req: AuthedReq) {
    return this.economy.licensing(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('tax')
  tax() {
    return this.economy.taxReporting();
  }

  @Get('disputes')
  disputes() {
    return this.economy.disputes();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.economy.analytics(req.translateAuth.organizationId);
  }
}
