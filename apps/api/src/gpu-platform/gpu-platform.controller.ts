import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { GpuPlatformService } from './gpu-platform.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/gpu-platform')
export class GpuPlatformController {
  constructor(private readonly gpu: GpuPlatformService) {}

  @Get('engine')
  engine() {
    return this.gpu.engine();
  }

  @Get('vendors')
  vendors() {
    return this.gpu.vendors();
  }

  @Get('pools')
  pools(@Query('vendor') vendor?: string) {
    return this.gpu.pools(vendor);
  }

  @Get('ceilings')
  ceilings() {
    return this.gpu.ceilings();
  }

  @Get('allocations')
  @UseGuards(TranslateAuthGuard)
  list(@Req() req: AuthedReq, @Query('status') status?: string) {
    return this.gpu.listAllocations({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      status,
    });
  }

  @Post('allocations')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  allocate(
    @Req() req: AuthedReq,
    @Body()
    body: {
      poolId?: string;
      instances?: number;
      purpose?: string;
      reservationHours?: number;
    },
  ) {
    return this.gpu.allocate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      poolId: body.poolId,
      instances: body.instances,
      purpose: body.purpose,
      reservationHours: body.reservationHours,
    });
  }

  @Post('allocations/:id/scale')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  scale(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { targetInstances?: number },
  ) {
    return this.gpu.scale({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      targetInstances: body.targetInstances,
    });
  }

  @Post('allocations/:id/release')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  release(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.gpu.release({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Get('health')
  @UseGuards(TranslateAuthGuard)
  health(@Req() req: AuthedReq) {
    return this.gpu.health({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('costs')
  @UseGuards(TranslateAuthGuard)
  costs(@Req() req: AuthedReq) {
    return this.gpu.costs({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.gpu.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.gpu.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
