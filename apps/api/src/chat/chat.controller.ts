import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('completions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  completions(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body
    body: {
      messages?: unknown;
      model?: string;
      translateReplyTo?: string;
    },
  ) {
    return this.chat.completions({
      messages: body.messages,
      model: body.model,
      translateReplyTo: body.translateReplyTo,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
