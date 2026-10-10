import { Injectable } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { mapClerkOrgRole } from './clerk-roles';
import {
  normalizeCountry,
  regionLabelForCountry,
} from '../residency/residency.catalog';
import { PLANS } from '../billing/plans';

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
    /**
     * Platform-admin org context switch (`X-Lugemi-Organization-Id`).
     * Only honored when the caller is on the platform admin allowlist.
     */
    preferredOrganizationId?: string;
    platformAdmin?: boolean;
    /** Signup / request geo (CF-IPCountry or X-Lugemi-Registered-From). */
    signupCountry?: string;
  }): Promise<SessionContext> {
    const clerkMappedRole = mapClerkOrgRole(input.clerkOrgRole);
    const signup = normalizeCountry(input.signupCountry);
    const user = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        email: input.email,
        name: input.name,
        ...(signup
          ? {
              registeredFrom: signup,
              residencyCountry: signup,
              residencyRegion: regionLabelForCountry(signup),
            }
          : {}),
      },
      update: {
        email: input.email,
        name: input.name,
      },
    });

    if (signup && !user.registeredFrom) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          registeredFrom: signup,
          residencyCountry: user.residencyCountry ?? signup,
          residencyRegion: user.residencyRegion ?? regionLabelForCountry(signup),
        },
      });
      user.registeredFrom = signup;
      user.residencyCountry = user.residencyCountry ?? signup;
      user.residencyRegion = user.residencyRegion ?? regionLabelForCountry(signup);
    }

    // Apply pending Lugemi invites before creating a personal org.
    await this.acceptPendingInvitesForUser(user.id, input.email);

    if (input.platformAdmin && input.preferredOrganizationId?.trim()) {
      const preferredOrg = await this.prisma.organization.findUnique({
        where: { id: input.preferredOrganizationId.trim() },
      });
      if (preferredOrg) {
        await this.prisma.membership.upsert({
          where: {
            organizationId_userId: {
              organizationId: preferredOrg.id,
              userId: user.id,
            },
          },
          create: {
            organizationId: preferredOrg.id,
            userId: user.id,
            role: MembershipRole.admin,
          },
          update: {},
        });

        let workspace =
          input.preferredWorkspaceId != null && input.preferredWorkspaceId !== ''
            ? await this.prisma.workspace.findFirst({
                where: { id: input.preferredWorkspaceId, organizationId: preferredOrg.id },
              })
            : null;
        if (!workspace) {
          workspace = await this.prisma.workspace.findFirst({
            where: { organizationId: preferredOrg.id },
            orderBy: { createdAt: 'asc' },
          });
        }
        if (!workspace) {
          workspace = await this.prisma.workspace.create({
            data: {
              organizationId: preferredOrg.id,
              name: 'Default',
              defaultSourceLang: 'en',
              defaultTargetLang: 'ak',
            },
          });
        }

        const membership = await this.prisma.membership.findUniqueOrThrow({
          where: {
            organizationId_userId: {
              organizationId: preferredOrg.id,
              userId: user.id,
            },
          },
        });

        // Do not rewrite the target customer org's plan when switching context.
        return {
          userId: user.id,
          organizationId: preferredOrg.id,
          workspaceId: workspace.id,
          clerkUserId: user.clerkUserId,
          role: membership.role,
          platformAdmin: true,
        };
      }
    }

    let organization =
      input.clerkOrgId != null
        ? await this.prisma.organization.findUnique({ where: { clerkOrgId: input.clerkOrgId } })
        : null;

    if (!organization && input.clerkOrgId) {
      organization = await this.prisma.organization.create({
        data: {
          clerkOrgId: input.clerkOrgId,
          name: input.orgName ?? 'Organization',
          ...(signup
            ? {
                registeredFrom: signup,
                residencyCountry: signup,
                residencyRegion: regionLabelForCountry(signup),
              }
            : {}),
          memberships: {
            create: { userId: user.id, role: MembershipRole.owner },
          },
          workspaces: {
            create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
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
        if (signup && !organization.registeredFrom) {
          organization = await this.prisma.organization.update({
            where: { id: organization.id },
            data: {
              registeredFrom: signup,
              residencyCountry: organization.residencyCountry ?? signup,
              residencyRegion: organization.residencyRegion ?? regionLabelForCountry(signup),
            },
          });
        }
      } else {
        organization = await this.prisma.organization.create({
          data: {
            name: input.orgName ?? `${input.name ?? 'Personal'} workspace`,
            ...(signup
              ? {
                  registeredFrom: signup,
                  residencyCountry: signup,
                  residencyRegion: regionLabelForCountry(signup),
                }
              : {}),
            memberships: {
              create: { userId: user.id, role: MembershipRole.owner },
            },
            workspaces: {
              create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
            },
          },
        });
      }
    } else {
      if (signup && !organization.registeredFrom) {
        organization = await this.prisma.organization.update({
          where: { id: organization.id },
          data: {
            registeredFrom: signup,
            residencyCountry: organization.residencyCountry ?? signup,
            residencyRegion: organization.residencyRegion ?? regionLabelForCountry(signup),
          },
        });
      }
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
          defaultTargetLang: 'ak',
        },
      });
    }

    const membership = await this.prisma.membership.findUniqueOrThrow({
      where: {
        organizationId_userId: { organizationId: organization.id, userId: user.id },
      },
    });

    if (input.platformAdmin) {
      await this.ensurePlatformAdminEntitlements(organization.id);
    }

    return {
      userId: user.id,
      organizationId: organization.id,
      workspaceId: workspace.id,
      clerkUserId: user.clerkUserId,
      role: membership.role,
      platformAdmin: Boolean(input.platformAdmin),
    };
  }

  /**
   * Platform admins hold full product control — pin their home org to enterprise
   * so API feature/quota gates never surface Upgrade prompts for them.
   */
  private async ensurePlatformAdminEntitlements(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });
    if (!org || org.plan === 'enterprise') return;

    const plan = PLANS.enterprise;
    if (!plan) return;
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: 'enterprise',
        characterQuota: plan.characterQuota,
        billingStatus: 'active',
      },
    });
  }

  /** Accept pending org invites matching the user's email (workspace RBAC invites). */
  private async acceptPendingInvitesForUser(userId: string, email?: string) {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) return;

    const pending = await this.prisma.organizationInvite.findMany({
      where: {
        email: normalized,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    for (const invite of pending) {
      await this.prisma.$transaction(async (tx) => {
        await tx.membership.upsert({
          where: {
            organizationId_userId: {
              organizationId: invite.organizationId,
              userId,
            },
          },
          create: {
            organizationId: invite.organizationId,
            userId,
            role: invite.role,
          },
          update: {},
        });
        await tx.organizationInvite.update({
          where: { id: invite.id },
          data: { status: 'accepted', acceptedAt: new Date() },
        });
      });
    }
  }
}
