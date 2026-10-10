import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ApiException } from './api-exception';
import { structuredLog } from '../logging/structured-logger';
import { captureApiException } from '../../observability/sentry';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<string>() === 'graphql') {
      this.catchGraphql(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request?.requestId ?? randomUUID();
    if (response?.setHeader) {
      response.setHeader('x-request-id', requestId);
    }

    if (exception instanceof ApiException) {
      const status = exception.getStatus();
      if (status >= 500) {
        structuredLog.error('api.exception', {
          event: 'api.exception',
          request_id: requestId,
          code: exception.code,
          status,
          message: exception.message,
        });
        captureApiException(exception, { request_id: requestId, code: exception.code });
      }
      response.status(status).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
            ? Array.isArray((body as { message: unknown }).message)
              ? (body as { message: string[] }).message.join(', ')
              : String((body as { message: unknown }).message)
            : exception.message;

      if (status >= 500) {
        structuredLog.error('http.exception', {
          event: 'http.exception',
          request_id: requestId,
          status,
          message,
        });
        captureApiException(exception, { request_id: requestId, status });
      }

      response.status(status).json({
        error: {
          code: status === HttpStatus.UNAUTHORIZED ? 'unauthorized' : 'http_error',
          message,
          request_id: requestId,
        },
      });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Internal server error';
    structuredLog.error('internal_error', {
      event: 'internal_error',
      request_id: requestId,
      message,
    });
    captureApiException(exception, { request_id: requestId });
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'internal_error',
        message,
        request_id: requestId,
      },
    });
  }

  private catchGraphql(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext<{ req?: Request & { requestId?: string } }>();
    const requestId = ctx?.req?.requestId ?? randomUUID();

    if (exception instanceof ApiException) {
      const status = exception.getStatus();
      if (status >= 500) {
        structuredLog.error('api.exception', {
          event: 'api.exception',
          request_id: requestId,
          code: exception.code,
          status,
          message: exception.message,
        });
        captureApiException(exception, { request_id: requestId, code: exception.code });
      }
      throw new GraphQLError(exception.message, {
        extensions: { code: exception.code, request_id: requestId, http: { status } },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
            ? Array.isArray((body as { message: unknown }).message)
              ? (body as { message: string[] }).message.join(', ')
              : String((body as { message: unknown }).message)
            : exception.message;
      throw new GraphQLError(message, {
        extensions: {
          code: status === HttpStatus.UNAUTHORIZED ? 'unauthorized' : 'http_error',
          request_id: requestId,
          http: { status },
        },
      });
    }

    if (exception instanceof GraphQLError) {
      throw exception;
    }

    const message = exception instanceof Error ? exception.message : 'Internal server error';
    structuredLog.error('internal_error', {
      event: 'internal_error',
      request_id: requestId,
      message,
    });
    captureApiException(exception, { request_id: requestId });
    throw new GraphQLError(message, {
      extensions: { code: 'internal_error', request_id: requestId },
    });
  }
}
