import { Body, Controller, Get, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RegionsService } from './regions.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller
export class RegionsController {
  constructor(private readonly regions: RegionsService) {}

  /** Public catalog of residency islands. */
  @Get('v1/regions')
  list {
    return this.regions.list;
  }

  @Get('v1/organization/residency')
  @UseGuards(ClerkAuthGuard)
  getResidency(@CurrentSession session: SessionContext) {
    return this.regions.getOrgResidency(session.organizationId);
  }

  @Patch('v1/organization/residency')
  @UseGuards(ClerkAuthGuard)
  setResidency(
    @CurrentSession session: SessionContext,
    @Body body: { dataRegion?: string | null },
    @Req req: Request,
  ) {
    if (!Object.prototype.hasOwnProperty.call(body ?? {}, 'dataRegion')) {
      throw new ApiException(
        'validation_error',
        'dataRegion is required (use null to clear the pin)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.regions.setOrgResidency({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      dataRegion: body.dataRegion ?? null,
      ip: req.ip,
    });
  }
}
