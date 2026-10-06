import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ResidencyService } from './residency.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/residency')
export class ResidencyController {
  constructor(private readonly residency: ResidencyService) {}

  /** Public policy — person = registration origin; models = data-center host. */
  @Get()
  policy(@Query('format') format: string | undefined, @Res() res: Response) {
    if (format === 'json') {
      return res.type('application/json').json(this.residency.policy());
    }
    return res.type('text/plain; charset=utf-8').send(this.residency.policyPlainText());
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  me(@CurrentSession() session: SessionContext) {
    return this.residency.getCombined({
      userId: session.userId,
      organizationId: session.organizationId,
    });
  }

  @Get('user')
  @UseGuards(ClerkAuthGuard)
  getUser(@CurrentSession() session: SessionContext) {
    return this.residency.getUserResidency(session.userId);
  }

  @Patch('user')
  @UseGuards(ClerkAuthGuard)
  patchUser(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      residencyCountry?: string | null;
      residencyRegion?: string | null;
      registeredFrom?: string | null;
    },
    @Req() req: Request,
  ) {
    if (
      body.residencyCountry === undefined &&
      body.residencyRegion === undefined &&
      body.registeredFrom === undefined
    ) {
      throw new ApiException(
        'validation_error',
        'Provide residencyCountry, residencyRegion, and/or registeredFrom',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.residency.patchUserResidency({
      userId: session.userId,
      organizationId: session.organizationId,
      residencyCountry: body.residencyCountry,
      residencyRegion: body.residencyRegion,
      registeredFrom: body.registeredFrom,
      ip: req.ip,
    });
  }

  @Get('organization')
  @UseGuards(ClerkAuthGuard)
  getOrg(@CurrentSession() session: SessionContext) {
    return this.residency.getOrgResidencyIdentity(session.organizationId);
  }

  @Patch('organization')
  @UseGuards(ClerkAuthGuard)
  patchOrg(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      residencyCountry?: string | null;
      residencyRegion?: string | null;
      registeredFrom?: string | null;
    },
    @Req() req: Request,
  ) {
    if (
      body.residencyCountry === undefined &&
      body.residencyRegion === undefined &&
      body.registeredFrom === undefined
    ) {
      throw new ApiException(
        'validation_error',
        'Provide residencyCountry, residencyRegion, and/or registeredFrom',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.residency.patchOrgResidency({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      residencyCountry: body.residencyCountry,
      residencyRegion: body.residencyRegion,
      registeredFrom: body.registeredFrom,
      ip: req.ip,
    });
  }

  /** Affinity selector: pick ready models near person/org residency. */
  @Get('select')
  @UseGuards(ClerkAuthGuard)
  select(
    @CurrentSession() session: SessionContext,
    @Query('feature') feature?: string,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
  ) {
    const feat = (feature ?? 'chat').trim();
    if (!feat) {
      throw new ApiException('validation_error', 'feature is required', HttpStatus.BAD_REQUEST);
    }
    return this.residency.selectModelsByResidency({
      feature: feat,
      userId: session.userId,
      organizationId: session.organizationId,
      residencyCountry: country,
      limit: limit ? Number(limit) : 10,
    });
  }
}
