import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DealBridgeService } from './dealbridge.service';

@Controller('v1/admin/dealbridge')
@UseGuards(PlatformAdminGuard)
export class DealBridgeAdminController {
  constructor(private readonly dealbridge: DealBridgeService) {}

  @Get('catalog')
  catalog() {
    return this.dealbridge.catalog();
  }

  @Get('pilot')
  async pilot(@Req() req: Request & { sessionAuth?: SessionContext }) {
    const organizationId = req.sessionAuth!.organizationId;
    return this.dealbridge.pilotDashboard(organizationId);
  }

  @Get('pilot/export')
  async export(@Req() req: Request & { sessionAuth?: SessionContext }) {
    const organizationId = req.sessionAuth!.organizationId;
    return this.dealbridge.exportPilot(organizationId);
  }

  @Post('pilot/config')
  upsertConfig(
    @Req() req: Request & { sessionAuth?: SessionContext },
    @Body()
    body: {
      version?: string;
      category?: string;
      corridor?: string;
      merchantVariety?: string;
      buyerVariety?: string;
      enrollmentStartsAt?: string;
      enrollmentEndsAt?: string;
      cohortAssignment?: unknown;
      metricDefinitions?: unknown;
      costBudgets?: unknown;
      thresholds?: unknown;
      evaluationProtocol?: unknown;
      active?: boolean;
    },
  ) {
    const organizationId = req.sessionAuth!.organizationId;
    return this.dealbridge.upsertPilotConfig(organizationId, {
      version: body.version ?? 'pilot-v1',
      category: body.category ?? 'wholesale_rice',
      corridor: body.corridor ?? 'en-fr',
      merchantVariety: body.merchantVariety ?? 'en',
      buyerVariety: body.buyerVariety ?? 'fr',
      enrollmentStartsAt: body.enrollmentStartsAt ?? new Date().toISOString(),
      enrollmentEndsAt:
        body.enrollmentEndsAt ??
        new Date(Date.now() + 42 * 24 * 3600_000).toISOString(),
      cohortAssignment: body.cohortAssignment,
      metricDefinitions: body.metricDefinitions,
      costBudgets: body.costBudgets,
      thresholds: body.thresholds,
      evaluationProtocol: body.evaluationProtocol,
      active: body.active,
    });
  }
}
