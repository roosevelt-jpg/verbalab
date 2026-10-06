import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @Get('organizations')
  @UseGuards(PlatformAdminGuard)
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.admin.searchOrganizations(q, limit ? Number(limit) : undefined);
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
