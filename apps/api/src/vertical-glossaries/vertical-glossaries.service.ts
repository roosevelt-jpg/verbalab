import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { isProOrAbove } from '../billing/plans';
import { upsertGlossarySnapshot } from '../glossary/glossary-snapshot-install';
import {
  VERTICAL_GLOSSARY_PACKS,
  VERTICAL_PREVIEW_LIMIT,
  findVerticalPack,
} from './vertical-glossary-seeds';

@Injectable()
export class VerticalGlossariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private serializePack(
    pack: (typeof VERTICAL_GLOSSARY_PACKS)[number],
    installed: boolean,
    includeFull: boolean,
  ) {
    const preview = pack.terms.slice(0, VERTICAL_PREVIEW_LIMIT);
    return {
      id: pack.id,
      vertical: pack.vertical,
      title: pack.title,
      description: pack.description,
      sourceLang: pack.sourceLang,
      targetLang: pack.targetLang,
      licenseTag: pack.licenseTag,
      termCount: pack.terms.length,
      preview,
      terms: includeFull ? pack.terms : undefined,
      installed,
    };
  }

  async list(organizationId: string, workspaceId: string) {
    const installs = await this.prisma.verticalGlossaryInstall.findMany({
      where: { organizationId, workspaceId },
      select: { packId: true },
    });
    const installed = new Set(installs.map((i) => i.packId));
    return VERTICAL_GLOSSARY_PACKS.map((pack) =>
      this.serializePack(pack, installed.has(pack.id), false),
    );
  }

  async get(organizationId: string, workspaceId: string, packId: string) {
    const pack = findVerticalPack(packId);
    if (!pack) {
      throw new ApiException('not_found', 'Vertical glossary pack not found', HttpStatus.NOT_FOUND);
    }
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true },
    });
    const install = await this.prisma.verticalGlossaryInstall.findUnique({
      where: {
        packId_workspaceId: { packId, workspaceId },
      },
    });
    const includeFull = isProOrAbove(org.plan) || Boolean(install);
    return this.serializePack(pack, Boolean(install), includeFull);
  }

  async listInstalls(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.verticalGlossaryInstall.findMany({
      where: { organizationId, workspaceId },
      orderBy: { installedAt: 'desc' },
    });
    return rows.map((r) => {
      const pack = findVerticalPack(r.packId);
      return {
        id: r.id,
        packId: r.packId,
        title: pack?.title ?? r.packId,
        vertical: pack?.vertical ?? null,
        termsInstalled: r.termsInstalled,
        installedAt: r.installedAt,
      };
    });
  }

  async install(input: {
    organizationId: string;
    workspaceId: string;
    packId: string;
    userId?: string;
    role: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const pack = findVerticalPack(input.packId);
    if (!pack) {
      throw new ApiException('not_found', 'Vertical glossary pack not found', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.verticalGlossaryInstall.findUnique({
      where: {
        packId_workspaceId: {
          packId: pack.id,
          workspaceId: input.workspaceId,
        },
      },
    });

    const termsInstalled = await this.prisma.$transaction(async (tx) => {
      const count = await upsertGlossarySnapshot(tx, {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        terms: pack.terms,
      });
      if (existing) {
        await tx.verticalGlossaryInstall.update({
          where: { id: existing.id },
          data: { termsInstalled: count, installedAt: new Date() },
        });
      } else {
        await tx.verticalGlossaryInstall.create({
          data: {
            packId: pack.id,
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            termsInstalled: count,
          },
        });
      }
      return count;
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'vertical_glossary.installed',
      route: `POST /v1/vertical-glossaries/${pack.id}/install`,
      ip: input.ip,
      metadata: { packId: pack.id, termsInstalled },
    });

    return {
      packId: pack.id,
      termsInstalled,
      reinstalled: Boolean(existing),
      listing: this.serializePack(pack, true, true),
    };
  }
}
