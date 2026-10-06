import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { KnowledgeAnalyticsService } from './knowledge-analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

@Controller('v1/knowledge-analytics')
export class KnowledgeAnalyticsController {
  constructor(private readonly analytics: KnowledgeAnalyticsService) {}

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

  @Get('growth')
  @UseGuards(TranslateAuthGuard)
  growth(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.growth({
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
      workspaceId: req.translateAuth.workspaceId,
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
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }

  @Get('search')
  @UseGuards(TranslateAuthGuard)
  search(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.search({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }

  @Get('gaps')
  @UseGuards(TranslateAuthGuard)
  gaps(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.gaps({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    });
  }

  @Get('confidence')
  @UseGuards(TranslateAuthGuard)
  confidence(@Req() req: Request & { translateAuth: TranslateAuthContext }) {
    return this.analytics.confidence({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('relationships')
  @UseGuards(TranslateAuthGuard)
  relationships(@Req() req: Request & { translateAuth: TranslateAuthContext }) {
    return this.analytics.relationships({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
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

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(
    @Req() req: Request & { translateAuth: TranslateAuthContext },
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
