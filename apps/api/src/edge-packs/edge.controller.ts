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
import { EdgeService, type EdgeMode } from './edge.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/edge')
export class EdgeController {
  constructor(private readonly edge: EdgeService) {}

  @Get('engine')
  engine() {
    return this.edge.engine();
  }

  @Get('packs')
  packs() {
    return this.edge.listPacks();
  }

  @Get('packs/:packId')
  pack(@Param('packId') packId: string) {
    return this.edge.getPack(packId);
  }

  @Post('packs/:packId/verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @Param('packId') packId: string,
    @Body() body: { expectedManifestHash?: string },
  ) {
    return this.edge.verifyPack(packId, body.expectedManifestHash);
  }

  @Post('packs/:packId/run')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  run(
    @Req() req: AuthedReq,
    @Param('packId') packId: string,
    @Body()
    body: {
      mode?: EdgeMode;
      text?: string;
      target?: string;
      cloudAuthorized?: boolean;
    },
  ) {
    if (!body.mode) {
      throw new ApiException('validation_error', 'mode is required', HttpStatus.BAD_REQUEST);
    }
    return this.edge.run({
      packId,
      mode: body.mode,
      text: body.text,
      target: body.target,
      cloudAuthorized: body.cloudAuthorized,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
