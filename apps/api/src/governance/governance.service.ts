import { HttpStatus, Injectable } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { LocalStorageService } from '../documents/local-storage.service';

export type DataSettings = {
  organizationId: string;
  name: string;
  retentionDays: number | null;
  persistSourceText: boolean;
  allowVendorTraining: boolean;
};

@Injectable()
export class GovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: LocalStorageService,
  ) {}

  async listMembers(organizationId: string) {
    const members = await this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async updateMemberRole(input: {
    organizationId: string;
    actorUserId: string;
    actorRole: string;
    membershipId: string;
    role: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.actorRole);
    const nextRole = this.parseRole(input.role);

    if (nextRole === MembershipRole.owner && input.actorRole !== 'owner') {
      throw new ApiException(
        'forbidden',
        'Only owners can promote another owner',
        HttpStatus.FORBIDDEN,
      );
    }

    const membership = await this.prisma.membership.findFirst({
      where: { id: input.membershipId, organizationId: input.organizationId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!membership) {
      throw new ApiException('not_found', 'Membership not found', HttpStatus.NOT_FOUND);
    }

    if (membership.role === MembershipRole.owner && nextRole !== MembershipRole.owner) {
      await this.assertNotLastOwner(input.organizationId, membership.id);
      if (input.actorRole !== 'owner') {
        throw new ApiException(
          'forbidden',
          'Only owners can demote an owner',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (membership.role === MembershipRole.admin && input.actorRole === 'admin' && nextRole === MembershipRole.owner) {
      throw new ApiException(
        'forbidden',
        'Only owners can promote another owner',
        HttpStatus.FORBIDDEN,
      );
    }

    if (input.actorRole === 'admin' && membership.role === MembershipRole.owner) {
      throw new ApiException('forbidden', 'Admins cannot change owner roles', HttpStatus.FORBIDDEN);
    }

    const updated = await this.prisma.membership.update({
      where: { id: membership.id },
      data: { role: nextRole },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'membership.role_updated',
      route: `PATCH /v1/organization/members/${membership.id}`,
      ip: input.ip,
      metadata: {
        membershipId: membership.id,
        targetUserId: membership.userId,
        from: membership.role,
        to: nextRole,
      },
    });

    return {
      id: updated.id,
      role: updated.role,
      createdAt: updated.createdAt,
      user: updated.user,
    };
  }

  async removeMember(input: {
    organizationId: string;
    actorUserId: string;
    actorRole: string;
    membershipId: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.actorRole);

    const membership = await this.prisma.membership.findFirst({
      where: { id: input.membershipId, organizationId: input.organizationId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!membership) {
      throw new ApiException('not_found', 'Membership not found', HttpStatus.NOT_FOUND);
    }

    if (membership.userId === input.actorUserId) {
      throw new ApiException(
        'validation_error',
        'You cannot remove yourself; ask another owner or delete the organization',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (membership.role === MembershipRole.owner) {
      if (input.actorRole !== 'owner') {
        throw new ApiException('forbidden', 'Only owners can remove an owner', HttpStatus.FORBIDDEN);
      }
      await this.assertNotLastOwner(input.organizationId, membership.id);
    }

    if (input.actorRole === 'admin' && membership.role !== MembershipRole.member) {
      throw new ApiException(
        'forbidden',
        'Admins can only remove members',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.membership.delete({ where: { id: membership.id } });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'membership.removed',
      route: `DELETE /v1/organization/members/${membership.id}`,
      ip: input.ip,
      metadata: {
        membershipId: membership.id,
        targetUserId: membership.userId,
        role: membership.role,
        email: membership.user.email,
      },
    });

    return { removed: true, id: membership.id };
  }

  private parseRole(role: string): MembershipRole {
    if (role === 'owner' || role === 'admin' || role === 'member') {
      return role as MembershipRole;
    }
    throw new ApiException(
      'validation_error',
      'role must be owner, admin, or member',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async assertNotLastOwner(organizationId: string, _membershipId: string) {
    const owners = await this.prisma.membership.count({
      where: { organizationId, role: MembershipRole.owner },
    });
    if (owners <= 1) {
      throw new ApiException(
        'validation_error',
        'Cannot demote or remove the last owner',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getSettings(organizationId: string): Promise<DataSettings> {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        retentionDays: true,
        persistSourceText: true,
        allowVendorTraining: true,
      },
    });
    return {
      organizationId: org.id,
      name: org.name,
      retentionDays: org.retentionDays,
      persistSourceText: org.persistSourceText,
      allowVendorTraining: org.allowVendorTraining,
    };
  }

  async updateSettings(input: {
    organizationId: string;
    userId: string;
    role: string;
    retentionDays?: number | null;
    persistSourceText?: boolean;
    allowVendorTraining?: boolean;
    ip?: string;
  }): Promise<DataSettings> {
    this.assertOwnerOrAdmin(input.role);

    const data: {
      retentionDays?: number | null;
      persistSourceText?: boolean;
      allowVendorTraining?: boolean;
    } = {};

    if (input.retentionDays !== undefined) {
      if (input.retentionDays !== null) {
        if (!Number.isInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 3650) {
          throw new ApiException(
            'invalid_request',
            'retentionDays must be null or an integer between 1 and 3650',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      data.retentionDays = input.retentionDays;
    }
    if (input.persistSourceText !== undefined) {
      data.persistSourceText = input.persistSourceText;
    }
    if (input.allowVendorTraining !== undefined) {
      data.allowVendorTraining = input.allowVendorTraining;
    }

    await this.prisma.organization.update({
      where: { id: input.organizationId },
      data,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'org.data_settings.updated',
      route: 'PATCH /v1/organization/data-settings',
      ip: input.ip,
      metadata: data,
    });

    return this.getSettings(input.organizationId);
  }

  async exportWorkspace(input: {
    organizationId: string;
    workspaceId: string;
    role: string;
    userId: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);

    const [
      org,
      workspace,
      glossaryTerms,
      tmEntries,
      reviews,
      knowledgeDocs,
      datasetAssets,
      apiKeys,
      usageEvents,
      memoryRecords,
    ] = await Promise.all([
        this.prisma.organization.findUniqueOrThrow({
          where: { id: input.organizationId },
          select: {
            id: true,
            name: true,
            plan: true,
            retentionDays: true,
            persistSourceText: true,
            allowVendorTraining: true,
            createdAt: true,
          },
        }),
        this.prisma.workspace.findFirst({
          where: { id: input.workspaceId, organizationId: input.organizationId },
        }),
        this.prisma.glossaryTerm.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.translationMemoryEntry.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.translationReview.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
        this.prisma.knowledgeDocument.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          select: {
            id: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.datasetAsset.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          select: {
            id: true,
            title: true,
            licenseTag: true,
            containsPii: true,
            partnerOrgName: true,
            status: true,
            sourceLang: true,
            targetLang: true,
            createdAt: true,
            versions: {
              select: {
                version: true,
                filename: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
              },
              orderBy: { version: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.apiKey.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          select: {
            id: true,
            name: true,
            prefix: true,
            createdAt: true,
            revokedAt: true,
          },
        }),
        this.prisma.usageEvent.findMany({
          where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
        this.prisma.memoryRecord.findMany({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            deletedAt: null,
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    if (!workspace) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'org.export.requested',
      route: 'POST /v1/organization/export',
      ip: input.ip,
      metadata: { workspaceId: input.workspaceId },
    });

    return {
      exportedAt: new Date().toISOString(),
      organization: org,
      workspace,
      glossaryTerms,
      tmEntries: org.persistSourceText
        ? tmEntries
        : tmEntries.map((e) => ({
            ...e,
            sourceText: '[redacted]',
            targetText: '[redacted]',
          })),
      translationReviews: org.persistSourceText
        ? reviews
        : reviews.map((r) => ({
            ...r,
            sourceText: '[redacted]',
            targetText: '[redacted]',
          })),
      knowledgeDocuments: knowledgeDocs,
      datasetAssets,
      apiKeys,
      usageEvents,
      memoryRecords,
    };
  }

  async deleteOrganization(input: {
    organizationId: string;
    userId: string;
    role: string;
    confirmName: string;
    ip?: string;
  }) {
    if (input.role !== 'owner') {
      throw new ApiException(
        'forbidden',
        'Only owners can delete the organization',
        HttpStatus.FORBIDDEN,
      );
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: { id: true, name: true },
    });

    if (input.confirmName.trim() !== org.name) {
      throw new ApiException(
        'invalid_request',
        'confirmName must exactly match the organization name',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [documents, knowledgeDocs, datasetVersions] = await Promise.all([
      this.prisma.document.findMany({
        where: { organizationId: input.organizationId },
        select: { storageKey: true },
      }),
      this.prisma.knowledgeDocument.findMany({
        where: { organizationId: input.organizationId },
        select: { storageKey: true },
      }),
      this.prisma.datasetVersion.findMany({
        where: { asset: { organizationId: input.organizationId } },
        select: { storageKey: true },
      }),
    ]);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'org.deleted',
      route: 'DELETE /v1/organization',
      ip: input.ip,
      metadata: { name: org.name },
    });

    await this.prisma.organization.delete({ where: { id: input.organizationId } });

    for (const doc of [...documents, ...knowledgeDocs, ...datasetVersions]) {
      if (doc.storageKey) {
        await this.storage.tryUnlink(doc.storageKey);
      }
    }

    return { deleted: true, organizationId: org.id, name: org.name };
  }

  async shouldPersistSourceText(organizationId: string): Promise<boolean> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { persistSourceText: true },
    });
    return org?.persistSourceText ?? true;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage data governance',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
