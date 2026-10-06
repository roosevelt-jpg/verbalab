import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { VoiceAnalyticsService } from './voice-analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

@Controller('v1/voice-analytics')
export class VoiceAnalyticsController {
  constructor(private readonly analytics: VoiceAnalyticsService) {}

  @Get('engine')
  engine() {
    return this.analytics.engine();
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.overview({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }

  @Get('usage')
  @UseGuards(TranslateAuthGuard)
  usage(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.usage({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('languages')
  @UseGuards(TranslateAuthGuard)
  languages(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.languages({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('voices')
  @UseGuards(TranslateAuthGuard)
  voices(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.voices({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('customers')
  @UseGuards(TranslateAuthGuard)
  customers(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.customers({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('revenue')
  @UseGuards(TranslateAuthGuard)
  revenue(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.revenue({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('latency')
  @UseGuards(TranslateAuthGuard)
  latency(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.latency({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('quality')
  @UseGuards(TranslateAuthGuard)
  quality(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.quality({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('streaming')
  @UseGuards(TranslateAuthGuard)
  streaming(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.streaming({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('downloads')
  @UseGuards(TranslateAuthGuard)
  downloads(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.downloads({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('marketplace')
  @UseGuards(TranslateAuthGuard)
  marketplace(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.marketplace({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.monitoring({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('report')
  @UseGuards(TranslateAuthGuard)
  report(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.report({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }
}
