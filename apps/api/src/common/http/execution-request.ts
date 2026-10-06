import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';

/** Resolve Express req/res for HTTP and GraphQL contexts (VL-136). */
export function getHttpPair(context: ExecutionContext): {
  req: Request;
  res?: Response;
} {
  if (context.getType<string>() === 'graphql') {
    const gql = GqlExecutionContext.create(context).getContext<{
      req: Request;
      res?: Response;
    }>();
    return { req: gql.req, res: gql.res };
  }
  return {
    req: context.switchToHttp().getRequest<Request>(),
    res: context.switchToHttp().getResponse<Response>(),
  };
}
