import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditRecordInput = {
  organizationId: string;
  userId?: string;
  action: string;
  route?: string;
  ip?: string;
  apiKeyPrefix?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditRecordInput) {
    return this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        route: input.route,
        ip: input.ip,
        apiKeyPrefix: input.apiKeyPrefix,
        metadata: input.metadata,
      },
    });
  }

  /** At most one session.sign_in per user/org per UTC day (avoids spam on every console request). */
  async recordSignInIfNeeded(input: {
    organizationId: string;
    userId: string;
    route?: string;
    ip?: string;
  }) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const existing = await this.prisma.auditEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'session.sign_in',
        createdAt: { gte: start },
      },
    });

    if (existing) return existing;

    return this.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'session.sign_in',
      route: input.route ?? 'session',
      ip: input.ip,
    });
  }

  async listForOrg(organizationId: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const events = await this.prisma.auditEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      route: event.route,
      ip: event.ip,
      apiKeyPrefix: event.apiKeyPrefix,
      metadata: event.metadata,
      createdAt: event.createdAt,
      user: event.user
        ? { id: event.user.id, email: event.user.email, name: event.user.name }
        : null,
    }));
  }
}
