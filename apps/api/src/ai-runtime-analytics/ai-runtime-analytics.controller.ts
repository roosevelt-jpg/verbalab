import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AiRuntimeAnalyticsService } from './ai-runtime-analytics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';

type AuthedReq = Request & { translateAuth: TranslateAuthContext };

@Controller('v1/ai-runtime-analytics')
export class AiRuntimeAnalyticsController {
  constructor(private readonly analytics: AiRuntimeAnalyticsService) {}

  @Get('engine')
  engine {
    return this.analytics.engine;
  }

  private ctx(req: AuthedReq, from?: string, to?: string) {
    return {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      from,
      to,
    };
  }

  @Get('overview')
  @UseGuards(TranslateAuthGuard)
  overview(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.overview(this.ctx(req, from, to));
  }

  @Get('latency')
  @UseGuards(TranslateAuthGuard)
  latency(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.latency(this.ctx(req, from, to));
  }

  @Get('throughput')
  @UseGuards(TranslateAuthGuard)
  throughput(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.throughput(this.ctx(req, from, to));
  }

  @Get('gpu')
  @UseGuards(TranslateAuthGuard)
  gpu(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.gpu(this.ctx(req, from, to));
  }

  @Get('cpu')
  @UseGuards(TranslateAuthGuard)
  cpu(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.cpu(this.ctx(req, from, to));
  }

  @Get('cache')
  @UseGuards(TranslateAuthGuard)
  cache(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.cache(this.ctx(req, from, to));
  }

  @Get('requests')
  @UseGuards(TranslateAuthGuard)
  requests(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.requests(this.ctx(req, from, to));
  }

  @Get('errors')
  @UseGuards(TranslateAuthGuard)
  errors(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.errors(this.ctx(req, from, to));
  }

  @Get('cost')
  @UseGuards(TranslateAuthGuard)
  cost(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.cost(this.ctx(req, from, to));
  }

  @Get('customers')
  @UseGuards(TranslateAuthGuard)
  customers(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.customers(this.ctx(req, from, to));
  }

  @Get('models')
  @UseGuards(TranslateAuthGuard)
  models(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.models(this.ctx(req, from, to));
  }

  @Get('streaming')
  @UseGuards(TranslateAuthGuard)
  streaming(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.streaming(this.ctx(req, from, to));
  }

  @Get('report')
  @UseGuards(TranslateAuthGuard)
  report(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.report(this.ctx(req, from, to));
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq, @Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.monitoring(this.ctx(req, from, to));
  }
}
