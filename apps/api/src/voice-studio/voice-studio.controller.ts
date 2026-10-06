import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VoiceStudioService, TimelineClip } from './voice-studio.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/voice-studio')
export class VoiceStudioController {
  constructor(private readonly studio: VoiceStudioService) {}

  private auth(req: AuthedReq) {
    return {
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    };
  }

  @Get('engine')
  engine {
    return this.studio.engine;
  }

  @Get('engine/analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.studio.analytics(req.translateAuth.organizationId);
  }

  @Get('library')
  @UseGuards(TranslateAuthGuard)
  library(@Req req: AuthedReq) {
    return this.studio.library(this.auth(req));
  }

  @Post('ssml/compile')
  compileSsml(@Body body: { ssml?: string }) {
    if (typeof body.ssml !== 'string') {
      throw new ApiException('validation_error', 'ssml is required', HttpStatus.BAD_REQUEST);
    }
    return this.studio.compileSsml(body.ssml);
  }

  @Get('pronunciation')
  @UseGuards(TranslateAuthGuard)
  listPronunciation(@Req req: AuthedReq) {
    return this.studio.listPronunciation(this.auth(req));
  }

  @Post('pronunciation')
  @UseGuards(TranslateAuthGuard)
  upsertPronunciation(
    @Req req: AuthedReq,
    @Body
    body: { id?: string; grapheme?: string; alias?: string; language?: string; notes?: string },
  ) {
    return this.studio.upsertPronunciation(this.auth(req), body);
  }

  @Delete('pronunciation/:id')
  @UseGuards(TranslateAuthGuard)
  deletePronunciation(@Req req: AuthedReq, @Param('id') id: string) {
    return this.studio.deletePronunciation(this.auth(req), id);
  }

  @Get('profiles')
  @UseGuards(TranslateAuthGuard)
  listProfiles(@Req req: AuthedReq) {
    return this.studio.listProfiles(this.auth(req));
  }

  @Post('profiles')
  @UseGuards(TranslateAuthGuard)
  upsertProfile(
    @Req req: AuthedReq,
    @Body body: { id?: string; name?: string; voice?: string; language?: string; notes?: string },
  ) {
    return this.studio.upsertProfile(this.auth(req), body);
  }

  @Delete('profiles/:id')
  @UseGuards(TranslateAuthGuard)
  deleteProfile(@Req req: AuthedReq, @Param('id') id: string) {
    return this.studio.deleteProfile(this.auth(req), id);
  }

  @Get('projects')
  @UseGuards(TranslateAuthGuard)
  listProjects(@Req req: AuthedReq) {
    return this.studio.listProjects(this.auth(req));
  }

  @Post('projects')
  @UseGuards(TranslateAuthGuard)
  upsertProject(
    @Req req: AuthedReq,
    @Body
    body: { id?: string; name?: string; description?: string; timeline?: TimelineClip[] },
  ) {
    return this.studio.upsertProject(this.auth(req), body);
  }

  @Delete('projects/:id')
  @UseGuards(TranslateAuthGuard)
  deleteProject(@Req req: AuthedReq, @Param('id') id: string) {
    return this.studio.deleteProject(this.auth(req), id);
  }

  @Post('preview')
  @UseGuards(TranslateAuthGuard)
  async preview(
    @Req req: AuthedReq,
    @Body
    body: {
      text?: string;
      ssml?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
    @Res res: Response,
  ) {
    const result = await this.studio.preview(this.auth(req), body);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', String(result.audio.length));
    res.setHeader('Content-Disposition', `inline; filename="studio-preview.${result.format}"`);
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Mode', 'preview');
    res.setHeader('X-Lugemi-Rendered-Text', encodeURIComponent(result.renderedText.slice(0, 200)));
    if (result.watermarkApplied) res.setHeader('X-Lugemi-Watermark', 'required');
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('generate')
  @UseGuards(TranslateAuthGuard)
  async generate(
    @Req req: AuthedReq,
    @Body
    body: {
      text?: string;
      ssml?: string;
      voice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
    @Res res: Response,
  ) {
    const result = await this.studio.generate(this.auth(req), body);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', String(result.audio.length));
    res.setHeader('Content-Disposition', `inline; filename="studio-generate.${result.format}"`);
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Mode', 'generate');
    if (result.watermarkApplied) res.setHeader('X-Lugemi-Watermark', 'required');
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('test')
  @UseGuards(TranslateAuthGuard)
  async test(
    @Req req: AuthedReq,
    @Body body: { voice?: string; language?: string },
    @Res res: Response,
  ) {
    const result = await this.studio.testVoice(this.auth(req), body);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', String(result.audio.length));
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Voice', result.voice);
    res.setHeader('X-Lugemi-Mode', 'test');
    if (result.watermarkApplied) res.setHeader('X-Lugemi-Watermark', 'required');
    res.status(HttpStatus.OK).send(result.audio);
  }

  @Post('compare')
  @UseGuards(TranslateAuthGuard)
  compare(
    @Req req: AuthedReq,
    @Body
    body: {
      text?: string;
      ssml?: string;
      voices?: string[];
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    return this.studio.compare(this.auth(req), body);
  }

  @Post('timeline/render')
  @UseGuards(TranslateAuthGuard)
  renderTimeline(
    @Req req: AuthedReq,
    @Body
    body: {
      clips?: TimelineClip[];
      projectId?: string;
      defaultVoice?: string;
      language?: string;
      format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    },
  ) {
    return this.studio.renderTimeline(this.auth(req), body);
  }
}
