import { Body, Controller, Get, Header, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CreativeMediaService } from './creative-media.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/creative-media')
export class CreativeMediaController {
  constructor(private readonly media: CreativeMediaService) {}

  @Get('engine')
  @Header('Cache-Control', 'public, max-age=120')
  engine() {
    return this.media.engine();
  }

  @Post('image')
  @UseGuards(TranslateAuthGuard)
  image(
    @Req() _req: Request & { translateAuth: TranslateAuthContext },
    @Body()
    body: { prompt?: string; style?: string; width?: number; height?: number; seed?: number },
  ) {
    if (!body.prompt?.trim()) {
      throw new ApiException('validation_error', 'prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.media.generateImage({
      prompt: body.prompt,
      style: body.style,
      width: body.width,
      height: body.height,
      seed: body.seed,
    });
  }

  @Post('video-plan')
  @UseGuards(TranslateAuthGuard)
  videoPlan(
    @Req() _req: Request & { translateAuth: TranslateAuthContext },
    @Body() body: { script?: string; title?: string; style?: string },
  ) {
    if (!body.script?.trim() && !body.title?.trim()) {
      throw new ApiException(
        'validation_error',
        'script or title is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.media.generateVideoPlan({
      script: body.script || body.title || '',
      title: body.title,
      style: body.style,
    });
  }

  @Post('sfx')
  @UseGuards(TranslateAuthGuard)
  sfx(
    @Req() _req: Request & { translateAuth: TranslateAuthContext },
    @Body() body: { prompt?: string; durationSec?: number },
  ) {
    if (!body.prompt?.trim()) {
      throw new ApiException('validation_error', 'prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.media.generateSfx({ prompt: body.prompt, durationSec: body.durationSec });
  }

  @Post('music')
  @UseGuards(TranslateAuthGuard)
  music(
    @Req() _req: Request & { translateAuth: TranslateAuthContext },
    @Body() body: { prompt?: string; durationSec?: number; genre?: string },
  ) {
    if (!body.prompt?.trim()) {
      throw new ApiException('validation_error', 'prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.media.generateMusic({
      prompt: body.prompt,
      durationSec: body.durationSec,
      genre: body.genre,
    });
  }
}
