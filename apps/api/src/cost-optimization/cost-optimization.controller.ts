import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CostOptimizationService } from './cost-optimization.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/cost-optimization')
export class CostOptimizationController {
  constructor(private readonly cost: CostOptimizationService) {}

  @Get('engine')
  engine {
    return this.cost.engine;
  }

  @Get('ceilings')
  ceilings {
    return this.cost.ceilings;
  }

  @Get('budgets')
  @UseGuards(TranslateAuthGuard)
  budgets(@Req req: AuthedReq) {
    return this.cost.getBudget({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Put('budgets')
  @UseGuards(TranslateAuthGuard)
  upsertBudget(
    @Req req: AuthedReq,
    @Body
    body: {
      dailyCapUsd?: number;
      monthlyCapUsd?: number;
      enforce?: boolean;
      preferSpot?: boolean;
      reservedCapacityUnits?: number;
      optimizeRouting?: boolean;
    },
  ) {
    return this.cost.upsertBudget({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('check')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  check(
    @Req req: AuthedReq,
    @Body body: { additionalUsd?: number; soft?: boolean },
  ) {
    return this.cost.check({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('record')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  record(
    @Req req: AuthedReq,
    @Body
    body: {
      category?: string;
      amountUsd?: number;
      feature?: string;
      providerId?: string;
      label?: string;
    },
  ) {
    return this.cost.record({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('optimize')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  optimize(
    @Req req: AuthedReq,
    @Body body: { feature?: string; tokensPer1k?: number },
  ) {
    return this.cost.optimize({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('gpu')
  @UseGuards(TranslateAuthGuard)
  gpu(@Req req: AuthedReq) {
    return this.cost.gpuView({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('predictions')
  @UseGuards(TranslateAuthGuard)
  predictions(@Req req: AuthedReq) {
    return this.cost.predictions({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('reports')
  @UseGuards(TranslateAuthGuard)
  reports(@Req req: AuthedReq) {
    return this.cost.reports({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.cost.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.cost.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
