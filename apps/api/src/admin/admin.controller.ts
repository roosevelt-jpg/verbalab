import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import { PrismaService } from '../prisma/prisma.service';
import { isPlatformAdmin } from '../common/admin/platform-admin';

@Controller('v1/admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  @UseGuards(ClerkAuthGuard)
  async status(@CurrentSession() session: SessionContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, clerkUserId: true },
    });
    return {
      admin: isPlatformAdmin({
        email: user?.email,
        clerkUserId: user?.clerkUserId ?? session.clerkUserId,
      }),
    };
  }

  @Get('plans')
  @UseGuards(PlatformAdminGuard)
  plans() {
    return this.admin.listPlans();
  }

  @Post('plans')
  @UseGuards(PlatformAdminGuard)
  createPlan(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      id: string;
      name: string;
      rank?: number;
      characterQuota?: number;
      sttMinutesQuota?: number;
      ttsCharsQuota?: number;
      translateCharsQuota?: number;
      chatTokensQuota?: number;
      ocrPagesQuota?: number;
      workspaceLimit?: number;
      priceMonthlyUsd?: number | null;
      priceLabel?: string;
      blurb?: string;
      features?: string[];
    },
  ) {
    return this.admin.createPlan({
      ...body,
      features: body.features as any,
      actorUserId: session.userId,
      ip: clientIp(req),
    });
  }

  @Patch('plans/:id')
  @UseGuards(PlatformAdminGuard)
  updatePlan(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      rank?: number;
      characterQuota?: number;
      sttMinutesQuota?: number;
      ttsCharsQuota?: number;
      translateCharsQuota?: number;
      chatTokensQuota?: number;
      ocrPagesQuota?: number;
      workspaceLimit?: number;
      priceMonthlyUsd?: number | null;
      priceLabel?: string;
      blurb?: string;
      features?: string[];
      stripePriceId?: string | null;
      active?: boolean;
    },
  ) {
    return this.admin.updatePlan(id, body as any, session.userId, clientIp(req));
  }

  @Post('workspaces/:id/plan')
  @UseGuards(PlatformAdminGuard)
  assignPlan(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      planId: string;
      characterQuota?: number;
      billingStatus?: string;
    },
  ) {
    return this.admin.assignPlan({
      organizationId: id,
      planId: body.planId,
      characterQuota: body.characterQuota,
      billingStatus: body.billingStatus,
      actorUserId: session.userId,
      ip: clientIp(req),
    });
  }

  @Get('workspaces')
  @UseGuards(PlatformAdminGuard)
  listWorkspaces(
    @Query('q') q?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.admin.listWorkspaces({
      q,
      plan,
      status,
      region,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('workspaces/analytics')
  @UseGuards(PlatformAdminGuard)
  analytics() {
    return this.admin.crossWorkspaceAnalytics();
  }

  @Get('workspaces/audit')
  @UseGuards(PlatformAdminGuard)
  platformAudit(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.admin.listPlatformAudit({
      q,
      limit: limit ? Number(limit) : undefined,
      organizationId,
    });
  }

  @Post('workspaces')
  @UseGuards(PlatformAdminGuard)
  createWorkspace(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      plan?: string;
      ownerEmail?: string;
      dataRegion?: string;
      residencyCountry?: string;
      residencyRegion?: string;
      registeredFrom?: string;
      characterQuota?: number;
    },
  ) {
    return this.admin.createWorkspace({
      actorUserId: session.userId,
      name: body.name ?? '',
      plan: body.plan,
      ownerEmail: body.ownerEmail,
      dataRegion: body.dataRegion,
      residencyCountry: body.residencyCountry,
      residencyRegion: body.residencyRegion,
      registeredFrom: body.registeredFrom,
      characterQuota: body.characterQuota,
      ip: clientIp(req),
    });
  }

  @Post('workspaces/bulk')
  @UseGuards(PlatformAdminGuard)
  bulk(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      action?: 'suspend' | 'resume' | 'export';
      organizationIds?: string[];
      reason?: string;
    },
  ) {
    return this.admin.bulkAction({
      actorUserId: session.userId,
      action: body.action ?? 'export',
      organizationIds: body.organizationIds ?? [],
      reason: body.reason,
      ip: clientIp(req),
    });
  }

  @Get('workspaces/:id')
  @UseGuards(PlatformAdminGuard)
  getWorkspace(@Param('id') id: string) {
    return this.admin.getWorkspace(id);
  }

  @Patch('workspaces/:id')
  @UseGuards(PlatformAdminGuard)
  updateWorkspace(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      plan?: string;
      characterQuota?: number;
      dataRegion?: string | null;
      residencyCountry?: string | null;
      residencyRegion?: string | null;
      registeredFrom?: string | null;
      billingStatus?: string;
      featureOverrides?: Record<string, boolean | null>;
      retentionDays?: number | null;
      persistSourceText?: boolean;
      allowVendorTraining?: boolean;
    },
  ) {
    return this.admin.updateWorkspace(id, session.userId, body, clientIp(req));
  }

  @Post('workspaces/:id/suspend')
  @UseGuards(PlatformAdminGuard)
  suspend(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { reason?: string },
  ) {
    return this.admin.setDisabled({
      organizationId: id,
      actorUserId: session.userId,
      disabled: true,
      reason: body.reason,
      ip: clientIp(req),
    });
  }

  @Post('workspaces/:id/resume')
  @UseGuards(PlatformAdminGuard)
  resume(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.admin.setDisabled({
      organizationId: id,
      actorUserId: session.userId,
      disabled: false,
      ip: clientIp(req),
    });
  }

  @Get('workspaces/:id/members')
  @UseGuards(PlatformAdminGuard)
  members(@Param('id') id: string) {
    return this.admin.listWorkspaceMembers(id);
  }

  @Get('workspaces/:id/usage')
  @UseGuards(PlatformAdminGuard)
  usage(@Param('id') id: string) {
    return this.admin.workspaceUsage(id);
  }

  @Get('workspaces/:id/audit')
  @UseGuards(PlatformAdminGuard)
  workspaceAudit(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.admin.listWorkspaceAudit(id, limit ? Number(limit) : undefined);
  }

  @Post('workspaces/:id/revoke-keys')
  @UseGuards(PlatformAdminGuard)
  revokeWorkspaceKeys(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.admin.revokeAllKeys({
      organizationId: id,
      actorUserId: session.userId,
      ip: clientIp(req),
    });
  }

  @Post('workspaces/:id/invites')
  @UseGuards(PlatformAdminGuard)
  invite(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { email?: string; role?: string },
  ) {
    return this.admin.inviteToWorkspace({
      organizationId: id,
      actorUserId: session.userId,
      email: body.email ?? '',
      role: body.role,
      ip: clientIp(req),
    });
  }

  @Post('workspaces/:id/open-as')
  @UseGuards(PlatformAdminGuard)
  openAs(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.admin.openAsWorkspace({
      organizationId: id,
      actorUserId: session.userId,
      ip: clientIp(req),
    });
  }

  @Get('organizations')
  @UseGuards(PlatformAdminGuard)
  search(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('plan') plan?: string,
  ) {
    return this.admin.searchOrganizations(q, limit ? Number(limit) : undefined, plan);
  }

  @Get('organizations/:id')
  @UseGuards(PlatformAdminGuard)
  getOne(@Param('id') id: string) {
    return this.admin.getOrganization(id);
  }

  @Post('organizations/:id/revoke-keys')
  @UseGuards(PlatformAdminGuard)
  revokeKeys(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
  ) {
    return this.admin.revokeAllKeys({
      organizationId: id,
      actorUserId: session.userId,
      ip: clientIp(req),
    });
  }

  @Post('organizations/:id/disable')
  @UseGuards(PlatformAdminGuard)
  disable(
    @Param('id') id: string,
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { disabled?: boolean; reason?: string },
  ) {
    return this.admin.setDisabled({
      organizationId: id,
      actorUserId: session.userId,
      disabled: body.disabled !== false,
      reason: body.reason,
      ip: clientIp(req),
    });
  }
}
