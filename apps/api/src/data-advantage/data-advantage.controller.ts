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
import { DataAdvantageService } from './data-advantage.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/data-advantage')
export class DataAdvantageController {
  constructor(private readonly data: DataAdvantageService) {}

  @Get('engine')
  engine() {
    return this.data.engine();
  }

  @Get('streams')
  streams() {
    return this.data.streams();
  }

  @Get('pipeline')
  pipeline() {
    return this.data.pipeline();
  }

  @Get('contributors')
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  listContributors(@Req() req: AuthedReq) {
    return this.data.listContributors(req.translateAuth.organizationId);
  }

  @Post('contributors')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  createContributor(
    @Req() req: AuthedReq,
    @Body()
    body: {
      agreementPolicyVersion?: string;
      permittedPurposes?: string[];
      territories?: string[];
      expiry?: string | null;
      compensationRecord?: string;
      contactRoute?: string;
    },
  ) {
    return this.data.createContributor({
      ...body,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('contributors/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  withdraw(@Req() req: AuthedReq, @Param('id') id: string) {
    if (!id?.trim()) {
      throw new ApiException('validation_error', 'contributor id is required', HttpStatus.BAD_REQUEST);
    }
    return this.data.withdrawContributor({
      contributorId: id.trim(),
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  ingest(
    @Req() req: AuthedReq,
    @Body()
    body: {
      datasetVersion?: string;
      artifactContent?: string;
      speakerGroupId?: string;
      sessionGroupId?: string;
      sourceLanguageTags?: string[];
      varietyId?: string | null;
      labelStatus?: string;
      permissionPolicyRef?: string;
      allowedTrainingFamilies?: string[];
      synthetic?: boolean;
      split?: string;
      reviewManifestRef?: string;
      streamId?: string;
      contributorId?: string;
      nearDuplicateOf?: string | null;
    },
  ) {
    return this.data.ingestRecord({
      ...body,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('records/export-check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  exportCheck(
    @Req() req: AuthedReq,
    @Body() body: { recordIds?: string[]; requiredPurpose?: string },
  ) {
    return this.data.exportCheck({
      recordIds: body.recordIds,
      requiredPurpose: body.requiredPurpose,
      organizationId: req.translateAuth.organizationId,
    });
  }

  @Post('error-loop/sample')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  errorLoop(
    @Req() req: AuthedReq,
    @Body()
    body: {
      streamId?: string;
      corridor?: string;
      severity?: string;
      includeRandomPrevalence?: boolean;
    },
  ) {
    return this.data.sampleErrorLoop({
      ...body,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('releases')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  freezeRelease(@Req() req: AuthedReq, @Body() body: { datasetVersion?: string }) {
    return this.data.freezeRelease({
      datasetVersion: body.datasetVersion,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
