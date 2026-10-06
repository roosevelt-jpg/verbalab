import { CanActivate, ExecutionContext, Injectable, HttpStatus } from '@nestjs/common';
import { ApiKeyGuard, ApiKeyContext } from './api-key.guard';
import { ClerkAuthGuard, SessionContext } from './clerk-auth.guard';
import { looksLikeApiKey } from '../crypto/api-keys';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../errors/api-exception';
import { getHttpPair } from '../http/execution-request';

export type TranslateAuthContext = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
};

@Injectable
export class TranslateAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeyGuard,
    private readonly clerk: ClerkAuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = getHttpPair(context);
    const request = req as Request & {
      apiKeyAuth?: ApiKeyContext;
      sessionAuth?: SessionContext;
      translateAuth?: TranslateAuthContext;
    };

    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim : '';

    if (token && looksLikeApiKey(token)) {
      await this.apiKeys.canActivate(context);
      request.translateAuth = {
        organizationId: request.apiKeyAuth!.organizationId,
        workspaceId: request.apiKeyAuth!.workspaceId,
        apiKeyId: request.apiKeyAuth!.apiKeyId,
      };
      return true;
    }

    await this.clerk.canActivate(context);
    await this.assertOrgActive(request.sessionAuth!.organizationId);
    request.translateAuth = {
      organizationId: request.sessionAuth!.organizationId,
      workspaceId: request.sessionAuth!.workspaceId,
    };
    return true;
  }

  private async assertOrgActive(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { disabledAt: true },
    });
    if (org?.disabledAt) {
      throw new ApiException(
        'org_disabled',
        'Organization is disabled. Contact support.',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
