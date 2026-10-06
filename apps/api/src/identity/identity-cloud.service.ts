import { Injectable } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Injectable
export class IdentityCloudService {
  constructor(private readonly prisma: PrismaService) {}

  me(session: SessionContext) {
    return {
      userId: session.userId,
      clerkUserId: session.clerkUserId,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      role: session.role,
      principal: 'human' as const,
      auth: 'clerk_jwt' as const,
    };
  }

  async overview(session: SessionContext) {
    const [org, members, keys] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: session.organizationId },
        select: { id: true, name: true, clerkOrgId: true, plan: true, disabledAt: true },
      }),
      this.prisma.membership.findMany({
        where: { organizationId: session.organizationId },
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.apiKey.findMany({
        where: { organizationId: session.organizationId },
        select: { revokedAt: true },
      }),
    ]);

    const activeKeys = keys.filter((k) => !k.revokedAt).length;
    const revokedKeys = keys.length - activeKeys;

    const byRole: Record<string, number> = {
      owner: 0,
      admin: 0,
      member: 0,
    };
    const data = members.map((m) => {
      byRole[m.role] = (byRole[m.role] ?? 0) + 1;
      return {
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      };
    });

    return {
      session: this.me(session),
      organization: {
        id: org.id,
        name: org.name,
        clerkOrgId: org.clerkOrgId,
        plan: org.plan,
        disabled: Boolean(org.disabledAt),
      },
      members: {
        total: data.length,
        byRole,
        data,
      },
      machineIdentity: {
        kind: 'api_key',
        activeKeys,
        revokedKeys,
        path: '/v1/api-keys',
      },
      rbac: {
        roles: [MembershipRole.owner, MembershipRole.admin, MembershipRole.member],
        abac: false,
      },
      teams: {
        supported: false,
        useInstead: 'workspaces',
        note: 'No Team entity — project isolation is workspaces.',
      },
      provider: {
        humanIdp: 'clerk',
        oauth2: true,
        oidc: true,
        jwt: true,
        saml: 'buy_clerk_or_workos',
        scim: 'buy_clerk_or_workos',
        passkeys: 'clerk',
        mfa: 'clerk',
        sso: 'clerk',
      },
      audit: {
        available: true,
        path: '/v1/audit-events',
        consolePath: '/audit',
      },
      docs: '/docs/IDENTITY_CLOUD.md',
    };
  }
}
