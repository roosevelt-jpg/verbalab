import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SpeechAnalyticsService } from './speech-analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

@Controller('v1/speech-analytics')
export class SpeechAnalyticsController {
  constructor(private readonly analytics: SpeechAnalyticsService) {}

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

  @Get('languages')
  @UseGuards(TranslateAuthGuard)
  languages(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.languages({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('dialects')
  @UseGuards(TranslateAuthGuard)
  dialects(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.dialects({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('accuracy')
  @UseGuards(TranslateAuthGuard)
  accuracy(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.accuracy({
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

  @Get('errors')
  @UseGuards(TranslateAuthGuard)
  errors(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.errors({
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

  @Get('customers')
  @UseGuards(TranslateAuthGuard)
  customers(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.customers({
      organizationId: req.translateAuth.organizationId,
      from,
      to,
    });
  }

  @Get('industries')
  @UseGuards(TranslateAuthGuard)
  industries(
    @Req req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.industries({
      organizationId: req.translateAuth.organizationId,
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
}
