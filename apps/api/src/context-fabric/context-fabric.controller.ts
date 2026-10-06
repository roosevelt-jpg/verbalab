import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ContextFabricService } from './context-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/context-fabric')
export class ContextFabricController {
  constructor(private readonly fabric: ContextFabricService) {}

  @Get('products')
  products {
    return this.fabric.products;
  }

  @Get('engine')
  engine {
    return this.fabric.products;
  }

  @Get('routes')
  routes {
    return this.fabric.routes;
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body body: { kinds?: string[] }) {
    return this.fabric.route({ kinds: body.kinds });
  }

  @Post('propagate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  propagate(
    @Req req: AuthedReq,
    @Body
    body: {
      kinds?: string[];
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      modelHint?: string;
      providerHint?: string;
      maxChars?: number;
      useCache?: boolean;
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.propagate(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      body,
    );
  }

  @Get('stream')
  stream(@Res res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.;

    const write =  => {
      const payload = JSON.stringify(this.fabric.streamSnapshot);
      res.write(`event: context-fabric\ndata: ${payload}\n\n`);
    };
    write;
    const timer = setInterval(write, 500);
    const done =  => {
      clearInterval(timer);
      res.end;
    };
    res.on('close', done);
    // Auto-close after a couple ticks so smoke/tests do not hang
    setTimeout(done, 1100);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.fabric.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.fabric.monitoring;
  }
}
