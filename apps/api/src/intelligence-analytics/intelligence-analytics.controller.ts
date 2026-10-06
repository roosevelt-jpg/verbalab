import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { IntelligenceAnalyticsService } from './intelligence-analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

@Controller('v1/intelligence-analytics')
export class IntelligenceAnalyticsController {
  constructor(private readonly analytics: IntelligenceAnalyticsService) {}

  @Get('engine')
  engine {
    return this.analytics.engine;
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(
    @Req req: Request & { translateAuth: TranslateAuthContext },
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
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.usage({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('surfaces')
  @UseGuards(TranslateAuthGuard)
  surfaces(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.surfaces({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('latency')
  @UseGuards(TranslateAuthGuard)
  latency(
    @Req req: Request & { translateAuth: TranslateAuthContext },
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
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.quality({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('routing')
  @UseGuards(TranslateAuthGuard)
  routing(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.routing({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('costs')
  @UseGuards(TranslateAuthGuard)
  costs(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.costs({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('report')
  @UseGuards(TranslateAuthGuard)
  report(
    @Req req: Request & { translateAuth: TranslateAuthContext },
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

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }
}
