import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ApiKeyEnvironment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateApiKeySecret } from '../common/crypto/api-keys';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    name: string;
    environment?: string;
    ip?: string;
  }) {
    const org = await this.prisma.organization.findFirst({
      where: { id: input.organizationId },
      select: { disabledAt: true },
    });
    if (!org) {
      throw new ApiException('not_found', 'Organization not found', HttpStatus.NOT_FOUND);
    }
    if (org.disabledAt) {
      throw new ApiException(
        'org_disabled',
        'Organization is disabled. Contact support.',
        HttpStatus.FORBIDDEN,
      );
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: input.workspaceId, organizationId: input.organizationId },
    });
    if (!workspace) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }

    const environment = this.parseEnvironment(input.environment);
    const { secret, prefix, hash } = generateApiKeySecret(environment);
    const key = await this.prisma.apiKey.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        createdById: input.userId,
        name: input.name,
        prefix,
        secretHash: hash,
        environment,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'api_key.created',
      route: 'POST /v1/api-keys',
      ip: input.ip,
      apiKeyPrefix: prefix,
      metadata: { keyId: key.id, name: key.name, environment },
    });

    return {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      environment: key.environment,
      kind: 'machine' as const,
      secret,
      createdAt: key.createdAt,
    };
  }

  async list(organizationId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      environment: key.environment,
      kind: 'machine' as const,
      revokedAt: key.revokedAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      workspaceId: key.workspaceId,
    }));
  }

  async revoke(organizationId: string, keyId: string, opts?: { userId?: string; ip?: string }) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId },
    });
    if (!key) {
      throw new ApiException('not_found', 'API key not found', HttpStatus.NOT_FOUND);
    }
    if (key.revokedAt) {
      return { id: key.id, revokedAt: key.revokedAt };
    }
    const updated = await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      organizationId,
      userId: opts?.userId,
      action: 'api_key.revoked',
      route: `DELETE /v1/api-keys/${keyId}`,
      ip: opts?.ip,
      apiKeyPrefix: key.prefix,
      metadata: { keyId: key.id, name: key.name, environment: key.environment },
    });

    return { id: updated.id, revokedAt: updated.revokedAt };
  }

  private parseEnvironment(raw?: string): ApiKeyEnvironment {
    if (raw == null || raw === '' || raw === 'live') return ApiKeyEnvironment.live;
    if (raw === 'test') return ApiKeyEnvironment.test;
    throw new ApiException(
      'validation_error',
      'environment must be live or test',
      HttpStatus.BAD_REQUEST,
    );
  }
}
