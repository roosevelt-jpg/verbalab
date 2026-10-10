import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { GovernanceService } from './governance.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/organization')
@UseGuards(ClerkAuthGuard)
export class GovernanceController {
  constructor(private readonly governance: GovernanceService) {}

  @Get('members')
  listMembers(@CurrentSession() session: SessionContext) {
    return this.governance.listMembers(session.organizationId);
  }

  @Patch('members/:id')
  updateMember(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { role?: string },
    @Req() req: Request,
  ) {
    return this.governance.updateMemberRole({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: session.role,
      membershipId: id,
      role: body.role ?? '',
      ip: clientIp(req),
    });
  }

  @Delete('members/:id')
  removeMember(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.governance.removeMember({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: session.role,
      membershipId: id,
      ip: clientIp(req),
    });
  }

  @Get('invites')
  listInvites(@CurrentSession() session: SessionContext) {
    return this.governance.listInvites(session.organizationId);
  }

  @Post('invites')
  createInvite(
    @CurrentSession() session: SessionContext,
    @Body() body: { email?: string; role?: string },
    @Req() req: Request,
  ) {
    return this.governance.createInvite({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: session.role,
      email: body.email ?? '',
      role: body.role ?? 'member',
      ip: clientIp(req),
    });
  }

  @Delete('invites/:id')
  revokeInvite(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.governance.revokeInvite({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: session.role,
      inviteId: id,
      ip: clientIp(req),
    });
  }

  @Get('branding')
  getBranding() {
    return this.governance.getBranding();
  }

  @Patch('branding')
  updateBranding(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      companyName?: string;
      logoUrl?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      region?: string;
      postalCode?: string;
      country?: string;
      socialX?: string;
      socialLinkedIn?: string;
      socialGitHub?: string;
      socialWebsite?: string;
    },
  ) {
    return this.governance.updateBranding({
      organizationId: session.organizationId,
      actorUserId: session.userId,
      actorRole: session.role,
      patch: body,
      ip: clientIp(req),
    });
  }

  @Get('data-settings')
  getSettings(@CurrentSession() session: SessionContext) {
    return this.governance.getSettings(session.organizationId);
  }

  @Patch('data-settings')
  updateSettings(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      retentionDays?: number | null;
      persistSourceText?: boolean;
      allowVendorTraining?: boolean;
    },
  ) {
    return this.governance.updateSettings({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      retentionDays: body.retentionDays,
      persistSourceText: body.persistSourceText,
      allowVendorTraining: body.allowVendorTraining,
      ip: clientIp(req),
    });
  }

  @Post('export')
  exportWorkspace(@CurrentSession() session: SessionContext, @Req() req: Request) {
    return this.governance.exportWorkspace({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      ip: clientIp(req),
    });
  }

  @Delete()
  deleteOrganization(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { confirmName?: string },
  ) {
    return this.governance.deleteOrganization({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      confirmName: body.confirmName ?? '',
      ip: clientIp(req),
    });
  }
}
