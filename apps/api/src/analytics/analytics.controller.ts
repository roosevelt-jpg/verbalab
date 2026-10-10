import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  catalog() {
    return this.analytics.catalog();
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
      from,
      to,
    });
  }

  @Get('translation')
  @UseGuards(TranslateAuthGuard)
  translation(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.translationUsage({
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
    return this.analytics.languageUsage({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('countries')
  @UseGuards(TranslateAuthGuard)
  countries(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.countryUsage({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('dialects')
  @UseGuards(TranslateAuthGuard)
  dialects(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.dialectUsage({
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

  @Get('costs')
  @UseGuards(TranslateAuthGuard)
  costs(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.costs({
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

  @Get('reports/enterprise')
  @UseGuards(TranslateAuthGuard)
  enterpriseReport(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.enterpriseReport({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }
}
