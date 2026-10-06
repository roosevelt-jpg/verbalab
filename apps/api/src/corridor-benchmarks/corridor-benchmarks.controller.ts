import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CorridorBenchmarksService } from './corridor-benchmarks.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/corridor-benchmarks')
export class CorridorBenchmarksController {
  constructor(private readonly benchmarks: CorridorBenchmarksService) {}

  @Get('engine')
  engine() {
    return this.benchmarks.engine();
  }

  @Get('comparison-matrix')
  comparisonMatrix() {
    return this.benchmarks.comparisonMatrix();
  }

  @Get('measurements')
  measurements() {
    return this.benchmarks.measurements();
  }

  @Get('integration-cases')
  integrationCases() {
    return this.benchmarks.integrationCases();
  }

  @Post('integration-cases/:id/run')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  runCase(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { simulatePass?: boolean },
  ) {
    if (!id?.trim()) {
      throw new ApiException('validation_error', 'case id is required', HttpStatus.BAD_REQUEST);
    }
    return this.benchmarks.runIntegrationCase({
      caseId: id.trim(),
      organizationId: req.translateAuth.organizationId,
      simulatePass: body.simulatePass,
    });
  }

  @Get('studies')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  listStudies(@Req() req: AuthedReq) {
    return this.benchmarks.listStudies(req.translateAuth.organizationId);
  }

  @Post('studies')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  preregister(
    @Req() req: AuthedReq,
    @Body()
    body: {
      primaryOutcome?: string;
      corridors?: string[];
      varieties?: string[];
      acousticConditions?: string[];
      exclusionCriteria?: string[];
      targetCoverage?: number | null;
      confidenceLevel?: number;
      subgroupSlices?: string[];
      stoppingRules?: string[];
      minimallyUsefulEffect?: string;
    },
  ) {
    return this.benchmarks.preregisterStudy({
      ...body,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('studies/:id/score')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  score(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      datasetVersion?: string;
      modelId?: string;
      modelVersion?: string;
      comparatorConfig?: string;
      criticalMeaningErrors?: number | null;
      acceptedSegments?: number | null;
      denominator?: number | null;
      coverage?: number | null;
      latencyP95Ms?: number | null;
      costPerSuccessfulTask?: number | null;
      intervalNote?: string;
      exclusions?: string[];
    },
  ) {
    if (!id?.trim()) {
      throw new ApiException('validation_error', 'study id is required', HttpStatus.BAD_REQUEST);
    }
    return this.benchmarks.scoreStudy({
      studyId: id.trim(),
      ...body,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('claims/validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  validateClaim(
    @Req() _req: AuthedReq,
    @Body()
    body: {
      datasetVersion?: string;
      corridorTask?: string;
      lugemiVersion?: string;
      definedError?: string;
      measuredChange?: string;
      comparator?: string;
      coverageLatencyCost?: string;
      testedDate?: string;
      interval?: string;
      denominator?: number | null;
      exclusions?: string[];
    },
  ) {
    return this.benchmarks.validateClaim(body);
  }
}
