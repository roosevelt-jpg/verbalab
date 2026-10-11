import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DialogueService, type DialogueTurn } from './dialogue.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/dialogue')
export class DialogueController {
  constructor(private readonly dialogue: DialogueService) {}

  @Post('synthesize')
  @UseGuards(TranslateAuthGuard)
  async synthesize(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { turns?: DialogueTurn[] },
    @Res() res: Response,
  ) {
    if (!Array.isArray(body.turns)) {
      throw new ApiException('validation_error', 'turns must be an array', HttpStatus.BAD_REQUEST);
    }
    const result = await this.dialogue.synthesize({
      turns: body.turns,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('X-Lugemi-Provider', result.provider);
    res.setHeader('X-Lugemi-Characters', String(result.characters));
    res.setHeader('X-Lugemi-Dialogue-Turns', String(result.turns.length));
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.status(HttpStatus.OK).send(result.audio);
  }
}
