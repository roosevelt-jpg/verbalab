import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../errors/api-exception';
import { hashApiKey, looksLikeApiKey } from '../crypto/api-keys';
import { PrismaService } from '../../prisma/prisma.service';
import { getHttpPair } from '../http/execution-request';

export type ApiKeyContext = {
  apiKeyId: string;
  organizationId: string;
  workspaceId: string;
  prefix: string;
};

@Injectable
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = getHttpPair(context);
    const request = req as Request & { apiKeyAuth?: ApiKeyContext };
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiException('unauthorized', 'Missing Bearer token', HttpStatus.UNAUTHORIZED);
    }

    const token = header.slice('Bearer '.length).trim;
    if (!looksLikeApiKey(token)) {
      throw new ApiException('unauthorized', 'Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    const secretHash = hashApiKey(token);
    const key = await this.prisma.apiKey.findFirst({
      where: { secretHash, revokedAt: null },
      include: { organization: { select: { disabledAt: true } } },
    });

    if (!key) {
      throw new ApiException('unauthorized', 'Invalid or revoked API key', HttpStatus.UNAUTHORIZED);
    }

    if (key.organization.disabledAt) {
      throw new ApiException(
        'org_disabled',
        'Organization is disabled. Contact support.',
        HttpStatus.FORBIDDEN,
      );
    }

    void this.prisma.apiKey
      .update({
        where: { id: key.id },
        data: { lastUsedAt: new Date },
      })
      .catch( => undefined);

    request.apiKeyAuth = {
      apiKeyId: key.id,
      organizationId: key.organizationId,
      workspaceId: key.workspaceId,
      prefix: key.prefix,
    };
    return true;
  }
}
