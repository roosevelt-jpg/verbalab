import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { StudioWorkflowService } from './studio-workflow.service';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-studio/workspace')
export class StudioWorkflowController {
  constructor(private readonly workflow: StudioWorkflowService) {}

  private auth(req: AuthedReq) {
    return {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    };
  }

  @Get('capabilities')
  capabilities() {
    return this.workflow.capabilities();
  }

  @Get('projects')
  @UseGuards(TranslateAuthGuard)
  listProjects(@Req() req: AuthedReq) {
    return this.workflow.listWorkspaceProjects(this.auth(req));
  }

  @Post('projects')
  @UseGuards(TranslateAuthGuard)
  createProject(
    @Req() req: AuthedReq,
    @Body()
    body: {
      name?: string;
      description?: string;
      sourceLanguage?: string;
      reviewPolicy?: string;
    },
  ) {
    return this.workflow.createWorkspaceProject(this.auth(req), body);
  }

  @Get('projects/:id')
  @UseGuards(TranslateAuthGuard)
  getProject(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.workflow.getWorkspaceProject(this.auth(req), id);
  }

  @Post('projects/:id/scripts')
  @UseGuards(TranslateAuthGuard)
  importScript(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { script?: string; parentRevisionId?: string },
  ) {
    return this.workflow.importScript(this.auth(req), id, body);
  }

  @Post('projects/:id/editions')
  @UseGuards(TranslateAuthGuard)
  createEdition(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      sourceRevisionId?: string;
      languageVariety?: string;
      voiceId?: string;
      expectedRevision?: number;
    },
  ) {
    return this.workflow.createEdition(this.auth(req), id, body);
  }

  @Post('editions/:id/translations')
  @UseGuards(TranslateAuthGuard)
  translate(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { expectedRevision?: number },
  ) {
    return this.workflow.translateEdition(this.auth(req), id, body);
  }

  @Post('editions/:id/generations')
  @UseGuards(TranslateAuthGuard)
  generate(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { expectedRevision?: number; segmentIds?: string[] },
  ) {
    return this.workflow.generateEdition(this.auth(req), id, body);
  }

  @Post('editions/:id/regenerations')
  @UseGuards(TranslateAuthGuard)
  regenerate(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      stableSegmentId?: string;
      translatedText?: string;
      expandContext?: boolean;
      expectedRevision?: number;
    },
  ) {
    return this.workflow.regenerateSegment(this.auth(req), id, body);
  }

  @Post('editions/:id/assemblies')
  @UseGuards(TranslateAuthGuard)
  assemble(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { takeIds?: string[]; pauseMs?: number; expectedRevision?: number },
  ) {
    return this.workflow.assembleEdition(this.auth(req), id, body);
  }

  @Post('takes/:id/reviews')
  @UseGuards(TranslateAuthGuard)
  reviewTake(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body()
    body: {
      decision?: 'approved' | 'rejected' | 'changes_requested' | 'needs_adjudication';
      ratings?: Record<string, number>;
      qualifications?: string[];
      spanNotes?: unknown[];
      pronunciationNotes?: string;
      meaningNotes?: string;
      takeHash?: string;
    },
  ) {
    return this.workflow.reviewTake(this.auth(req), id, body);
  }

  @Get('takes/:id/audio')
  @UseGuards(TranslateAuthGuard)
  async takeAudio(@Req() req: AuthedReq, @Param('id') id: string, @Res() res: Response) {
    const take = await this.workflow.getTakeAudio(this.auth(req), id);
    const buf = Buffer.from(take.audioBase64, 'base64');
    res.setHeader('Content-Type', take.mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Lugemi-Audio-Sha256', take.audioSha256);
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.setHeader('X-Lugemi-Stale', String(take.stale));
    res.status(HttpStatus.OK).send(buf);
  }

  @Post('assemblies/:id/approvals')
  @UseGuards(TranslateAuthGuard)
  approve(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { assemblyHash?: string; expectedEditionRevision?: number },
  ) {
    return this.workflow.approveRelease(this.auth(req), id, body);
  }

  @Get('assemblies/:id/audio')
  @UseGuards(TranslateAuthGuard)
  async assemblyAudio(@Req() req: AuthedReq, @Param('id') id: string, @Res() res: Response) {
    const assembly = await this.workflow.getAssemblyAudio(this.auth(req), id);
    const buf = Buffer.from(assembly.audioBase64, 'base64');
    res.setHeader('Content-Type', assembly.mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Lugemi-Audio-Sha256', assembly.audioSha256);
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.status(HttpStatus.OK).send(buf);
  }

  @Post('releases/:id/exports')
  @UseGuards(TranslateAuthGuard)
  exportRelease(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { format?: string },
  ) {
    return this.workflow.exportRelease(this.auth(req), id, body);
  }

  @Post('pronunciations')
  @UseGuards(TranslateAuthGuard)
  upsertPronunciation(
    @Req() req: AuthedReq,
    @Body()
    body: {
      id?: string;
      writtenForm?: string;
      value?: string;
      languageVariety?: string;
      scope?: string;
      projectId?: string;
      representation?: string;
      compatibleModelIds?: string[];
      status?: string;
      notes?: string;
    },
  ) {
    return this.workflow.upsertPronunciationEntry(this.auth(req), body);
  }
}
