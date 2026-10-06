import { Injectable } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { mapClerkOrgRole } from './clerk-roles';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async ensureSessionIdentity(input: {
    clerkUserId: string;
    email?: string;
    name?: string;
    clerkOrgId?: string;
    orgName?: string;
    /** Clerk organization role claim (`o.rol`), when present. */
    clerkOrgRole?: string;
    /** Optional workspace override (must belong to the resolved org). */
    preferredWorkspaceId?: string;
  }): Promise<SessionContext> {
    const clerkMappedRole = mapClerkOrgRole(input.clerkOrgRole);
    const user = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        email: input.email,
        name: input.name,
      },
      update: {
        email: input.email,
        name: input.name,
      },
    });

    let organization =
      input.clerkOrgId != null
        ? await this.prisma.organization.findUnique({ where: { clerkOrgId: input.clerkOrgId } })
        : null;

    if (!organization && input.clerkOrgId) {
      organization = await this.prisma.organization.create({
        data: {
          clerkOrgId: input.clerkOrgId,
          name: input.orgName ?? 'Organization',
          memberships: {
            create: { userId: user.id, role: MembershipRole.owner },
          },
          workspaces: {
            create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          },
        },
      });
    }

    if (!organization) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: user.id },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });

      if (membership) {
        organization = membership.organization;
      } else {
        organization = await this.prisma.organization.create({
          data: {
            name: input.orgName ?? `${input.name ?? 'Personal'} workspace`,
            memberships: {
              create: { userId: user.id, role: MembershipRole.owner },
            },
            workspaces: {
              create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
            },
          },
        });
      }
    } else {
      const existingMembership = await this.prisma.membership.findUnique({
        where: {
          organizationId_userId: { organizationId: organization.id, userId: user.id },
        },
      });

      const createRole = clerkMappedRole ?? MembershipRole.member;
      await this.prisma.membership.upsert({
        where: {
          organizationId_userId: { organizationId: organization.id, userId: user.id },
        },
        create: {
          organizationId: organization.id,
          userId: user.id,
          role: createRole,
        },
        update: clerkMappedRole ? { role: clerkMappedRole } : {},
      });

      if (!existingMembership && input.email) {
        void this.notifications.notifyMemberAdded({
          organizationId: organization.id,
          organizationName: organization.name,
          email: input.email,
          role: createRole,
        });
      }
    }

    let workspace =
      input.preferredWorkspaceId != null && input.preferredWorkspaceId !== ''
        ? await this.prisma.workspace.findFirst({
            where: { id: input.preferredWorkspaceId, organizationId: organization.id },
          })
        : null;

    if (!workspace) {
      workspace = await this.prisma.workspace.findFirst({
        where: { organizationId: organization.id },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          organizationId: organization.id,
          name: 'Default',
          defaultSourceLang: 'en',
          defaultTargetLang: 'sw',
        },
      });
    }

    const membership = await this.prisma.membership.findUniqueOrThrow({
      where: {
        organizationId_userId: { organizationId: organization.id, userId: user.id },
      },
    });

    return {
      userId: user.id,
      organizationId: organization.id,
      workspaceId: workspace.id,
      clerkUserId: user.clerkUserId,
      role: membership.role,
    };
  }
}
