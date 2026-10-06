import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { FineTunesService } from '../finetunes/finetunes.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

/**
 * VL-111 surface for rented-GPU training jobs (same `fine_tune_jobs` table as VL-104).
 */
@Controller('v1/training-jobs')
export class TrainingJobsController {
  constructor(private readonly finetunes: FineTunesService) {}

  @Get('launchers')
  @UseGuards(ClerkAuthGuard)
  launchers() {
    return this.finetunes.launcherStatus();
  }

  /**
   * Signed callback from Modal/Vertex workers.
   * Auth: header `X-Lugemi-Training-Token` or body.callbackToken.
   */
  @Post('callback')
  callback(
    @Headers('x-lugemi-training-token') headerToken: string | undefined,
    @Body()
    body: {
      jobId?: string;
      callbackToken?: string;
      status?: 'succeeded' | 'failed';
      artifactKind?: string;
      artifactUri?: string;
      useGoldenPhraseMap?: boolean;
      errorMessage?: string;
      promote?: boolean;
    },
  ) {
    const token = headerToken ?? body.callbackToken;
    if (!body.jobId || !token) {
      throw new ApiException(
        'validation_error',
        'jobId and callbackToken are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (body.status !== 'succeeded' && body.status !== 'failed') {
      throw new ApiException(
        'validation_error',
        'status must be succeeded or failed',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.finetunes.handleCallback({
      jobId: body.jobId,
      callbackToken: token,
      status: body.status,
      artifactKind: body.artifactKind,
      artifactUri: body.artifactUri,
      useGoldenPhraseMap: body.useGoldenPhraseMap,
      errorMessage: body.errorMessage,
      promote: body.promote,
    });
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession() session: SessionContext) {
    return this.finetunes.listJobs(session.organizationId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      sourceLang?: string;
      targetLang?: string;
      launcher?: string;
      baseModel?: string;
      datasetAssetId?: string;
    },
    @Req() req: Request,
  ) {
    return this.finetunes.createJob({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      sourceLang: body.sourceLang ?? '',
      targetLang: body.targetLang ?? '',
      launcher: body.launcher,
      baseModel: body.baseModel,
      datasetAssetId: body.datasetAssetId,
      ip: req.ip,
    });
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  get(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.finetunes.getJob(session.organizationId, id);
  }

  @Post(':id/launch')
  @UseGuards(ClerkAuthGuard)
  launch(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.finetunes.launchJob({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      jobId: id,
      ip: req.ip,
    });
  }

  @Post(':id/complete')
  @UseGuards(ClerkAuthGuard)
  complete(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body()
    body: {
      artifactKind?: string;
      artifactUri?: string;
      useGoldenPhraseMap?: boolean;
      promote?: boolean;
      displayName?: string;
    },
    @Req() req: Request,
  ) {
    return this.finetunes.completeJob({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      jobId: id,
      artifactKind: body.artifactKind ?? 'phrase_map',
      artifactUri: body.artifactUri,
      useGoldenPhraseMap: body.useGoldenPhraseMap,
      promote: body.promote,
      displayName: body.displayName,
      ip: req.ip,
    });
  }
}
