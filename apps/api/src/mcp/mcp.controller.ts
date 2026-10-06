import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';
import { mcpDiscovery } from './mcp.catalog';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/mcp')
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Get()
  discovery() {
    return mcpDiscovery();
  }

  @Post()
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async handle(@Req() req: AuthedReq, @Res() res: Response, @Body() body: unknown) {
    const meta = { userId: req.sessionAuth?.userId, ip: clientIp(req) };
    const messages = Array.isArray(body) ? body : [body];
    const results: unknown[] = [];

    for (const raw of messages) {
      const msg = (raw ?? {}) as {
        jsonrpc?: string;
        id?: string | number | null;
        method?: string;
        params?: Record<string, unknown>;
      };
      if (msg.method === 'notifications/initialized' || msg.method === 'initialized') continue;
      const handled = await this.mcp.handleMessage(msg, req.translateAuth, meta);
      if (handled.error) {
        results.push({ jsonrpc: '2.0', id: handled.id, error: handled.error });
      } else {
        results.push({ jsonrpc: '2.0', id: handled.id, result: handled.result });
      }
    }

    if (results.length === 0) {
      res.status(202).end();
      return;
    }
    if (Array.isArray(body)) {
      res.status(200).json(results);
      return;
    }
    res.status(200).json(results[0]);
  }
}
