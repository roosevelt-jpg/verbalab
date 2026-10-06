import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { structuredLog } from '../logging/structured-logger';

@Injectable
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && incoming.trim.length > 0 ? incoming.trim : randomUUID;
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const started = Date.now;
    res.on('finish',  => {
      structuredLog.info('http.request', {
        event: 'http.request',
        request_id: requestId,
        method: req.method,
        path: req.originalUrl?.split('?')[0] ?? req.url,
        status: res.statusCode,
        duration_ms: Date.now - started,
      });
    });

    next;
  }
}
