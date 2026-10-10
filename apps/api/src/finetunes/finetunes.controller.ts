import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { FineTunesService } from './finetunes.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/finetunes')
@UseGuards(ClerkAuthGuard)
export class FineTunesController {
  constructor(private readonly finetunes: FineTunesService) {}

  @Get('candidates')
  candidates() {
    return this.finetunes.listCandidates();
  }

  @Get('jobs')
  jobs(@CurrentSession() session: SessionContext) {
    return this.finetunes.listJobs(session.organizationId);
  }

  @Get('models')
  models() {
    return this.finetunes.listModels();
  }

  @Post('jobs')
  createJob(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      sourceLang?: string;
      targetLang?: string;
      launcher?: string;
      baseModel?: string;
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
      ip: req.ip,
    });
  }

  @Post('jobs/:id/launch')
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

  @Post('jobs/:id/complete')
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

  @Post('models/:id/retire')
  retire(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.finetunes.retireModel({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      modelId: id,
      ip: req.ip,
    });
  }
}
