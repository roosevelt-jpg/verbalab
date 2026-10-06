import { Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('summary')
  @UseGuards(ClerkAuthGuard)
  summary(@CurrentSession() session: SessionContext) {
    return this.billing.getSummary(session.organizationId);
  }

  @Post('checkout')
  @UseGuards(ClerkAuthGuard)
  checkout(@CurrentSession() session: SessionContext, @Req() req: Request) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage billing',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.billing.createCheckoutSession({
      organizationId: session.organizationId,
      userId: session.userId,
      ip: clientIp(req),
    });
  }

  @Post('portal')
  @UseGuards(ClerkAuthGuard)
  portal(@CurrentSession() session: SessionContext, @Req() req: Request) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage billing',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.billing.createPortalSession({
      organizationId: session.organizationId,
      userId: session.userId,
      ip: clientIp(req),
    });
  }

  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) {
      throw new ApiException('invalid_webhook', 'Missing stripe-signature header', HttpStatus.BAD_REQUEST);
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new ApiException(
        'invalid_webhook',
        'Raw body unavailable for webhook verification',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.billing.handleWebhook(rawBody, signature);
  }
}
