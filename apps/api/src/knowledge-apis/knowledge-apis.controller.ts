import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { KnowledgeApisService } from './knowledge-apis.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-apis')
export class KnowledgeApisController {
  constructor(private readonly knowledgeApis: KnowledgeApisService) {}

  @Get('engine')
  engine() {
    return this.knowledgeApis.engine();
  }

  @Get('surfaces')
  @UseGuards(TranslateAuthGuard)
  async surfaces(@Req() req: AuthedReq) {
    await this.knowledgeApis.recordSurfacesView(
      req.translateAuth.organizationId,
      req.sessionAuth?.userId,
      clientIp(req),
    );
    return this.knowledgeApis.surfaces();
  }

  @Get('graphql')
  graphqlCatalog() {
    return this.knowledgeApis.graphqlCatalog();
  }

  @Get('openapi')
  openapi() {
    return this.knowledgeApis.openapi();
  }

  @Get('sdk')
  sdk() {
    return this.knowledgeApis.sdk();
  }

  @Get('cli')
  cli() {
    return this.knowledgeApis.cli();
  }

  @Get('webhooks')
  webhooks() {
    return this.knowledgeApis.webhooks();
  }

  @Get('developer-portal')
  developerPortal() {
    return this.knowledgeApis.developerPortal();
  }

  @Get('events')
  @UseGuards(TranslateAuthGuard)
  events(@Req() req: AuthedReq, @Query('limit') limit?: string) {
    return this.knowledgeApis.recentEvents(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('events/stream')
  @UseGuards(TranslateAuthGuard)
  async stream(@Req() req: AuthedReq, @Res() res: Response) {
    const events = await this.knowledgeApis.recentEvents(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      15,
    );
    await this.knowledgeApis.recordStream(
      req.translateAuth.organizationId,
      req.sessionAuth?.userId,
      clientIp(req),
      events.events.length,
    );

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(
      `event: meta\ndata: ${JSON.stringify({
        product: 'knowledge-apis',
        note: 'One-shot SSE audit tail — not bidirectional realtime OS.',
        count: events.events.length,
      })}\n\n`,
    );

    for (const ev of events.events) {
      res.write(`event: knowledge_audit\ndata: ${JSON.stringify(ev)}\n\n`);
    }

    res.write(
      `event: done\ndata: ${JSON.stringify({ ok: true, honesty: { kafkaEventStreamingOs: false } })}\n\n`,
    );
    res.end();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.knowledgeApis.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.knowledgeApis.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }
}
