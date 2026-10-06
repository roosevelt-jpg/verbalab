import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiKeyContext } from '../guards/api-key.guard';
import { SessionContext } from '../guards/clerk-auth.guard';

export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyContext => {
    const request = ctx.switchToHttp.getRequest<{ apiKeyAuth: ApiKeyContext }>;
    return request.apiKeyAuth;
  },
);

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionContext => {
    const request = ctx.switchToHttp.getRequest<{ sessionAuth: SessionContext }>;
    return request.sessionAuth;
  },
);
