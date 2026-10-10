import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import {
  LUGEMI_DATA_CENTERS,
  affinityForCountry,
  normalizeCountry,
  preferredDataCenterForCountry,
  regionLabelForCountry,
  residencyPolicyText,
  type HostedRegionAffinity,
} from './residency.catalog';
import { defaultHostingForModelSlug } from './residency.catalog';

export type ResidencyFields = {
  residencyCountry: string | null;
  residencyRegion: string | null;
  registeredFrom: string | null;
};

@Injectable()
export class ResidencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  policy() {
    return {
      contentType: 'text/plain',
      text: residencyPolicyText(),
      dataCenters: LUGEMI_DATA_CENTERS,
      note:
        'Person residency = registration origin. Model residency = data-center host. Routing uses affinity.',
    };
  }

  policyPlainText(): string {
    return residencyPolicyText();
  }

  async getUserResidency(userId: string): Promise<ResidencyFields & { userId: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        residencyCountry: true,
        residencyRegion: true,
        registeredFrom: true,
      },
    });
    return {
      userId: user.id,
      residencyCountry: user.residencyCountry,
      residencyRegion: user.residencyRegion,
      registeredFrom: user.registeredFrom,
    };
  }

  async getOrgResidencyIdentity(organizationId: string): Promise<
    ResidencyFields & { organizationId: string; dataRegion: string | null }
  > {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        residencyCountry: true,
        residencyRegion: true,
        registeredFrom: true,
        dataRegion: true,
      },
    });
    return {
      organizationId: org.id,
      residencyCountry: org.residencyCountry,
      residencyRegion: org.residencyRegion,
      registeredFrom: org.registeredFrom,
      dataRegion: org.dataRegion,
    };
  }

  async getCombined(input: { userId: string; organizationId: string }) {
    const [user, org] = await Promise.all([
      this.getUserResidency(input.userId),
      this.getOrgResidencyIdentity(input.organizationId),
    ]);
    const effectiveCountry =
      normalizeCountry(user.residencyCountry) ??
      normalizeCountry(org.residencyCountry) ??
      normalizeCountry(user.registeredFrom) ??
      normalizeCountry(org.registeredFrom);
    const preferred = preferredDataCenterForCountry(effectiveCountry);
    return {
      user,
      organization: org,
      effective: {
        residencyCountry: effectiveCountry,
        residencyRegion:
          user.residencyRegion ||
          org.residencyRegion ||
          (effectiveCountry ? regionLabelForCountry(effectiveCountry) : null),
        preferredDataCenter: preferred.code,
        preferredAffinity: preferred.affinity,
        preferredLabel: preferred.label,
      },
      policy: 'Affinity: prefer models hosted near effective person/org residency when ready.',
    };
  }

  async patchUserResidency(input: {
    userId: string;
    organizationId: string;
    residencyCountry?: string | null;
    residencyRegion?: string | null;
    registeredFrom?: string | null;
    ip?: string;
  }) {
    const data: {
      residencyCountry?: string | null;
      residencyRegion?: string | null;
      registeredFrom?: string | null;
    } = {};

    if (input.residencyCountry !== undefined) {
      data.residencyCountry =
        input.residencyCountry === null || input.residencyCountry === ''
          ? null
          : normalizeCountry(input.residencyCountry);
      if (input.residencyCountry && !data.residencyCountry) {
        throw new ApiException(
          'validation_error',
          'residencyCountry must be an ISO 3166-1 alpha-2 code',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (input.residencyRegion !== undefined) {
      data.residencyRegion = input.residencyRegion?.trim() || null;
    }
    if (input.registeredFrom !== undefined) {
      data.registeredFrom =
        input.registeredFrom === null || input.registeredFrom === ''
          ? null
          : normalizeCountry(input.registeredFrom);
      if (input.registeredFrom && !data.registeredFrom) {
        throw new ApiException(
          'validation_error',
          'registeredFrom must be an ISO 3166-1 alpha-2 code',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (
      data.residencyCountry &&
      data.residencyRegion === undefined &&
      input.residencyRegion === undefined
    ) {
      data.residencyRegion = regionLabelForCountry(data.residencyCountry);
    }

    const updated = await this.prisma.user.update({
      where: { id: input.userId },
      data,
      select: {
        id: true,
        residencyCountry: true,
        residencyRegion: true,
        registeredFrom: true,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'user.residency_set',
      route: 'PATCH /v1/residency/user',
      ip: input.ip,
      metadata: data,
    });

    return {
      userId: updated.id,
      residencyCountry: updated.residencyCountry,
      residencyRegion: updated.residencyRegion,
      registeredFrom: updated.registeredFrom,
    };
  }

  async patchOrgResidency(input: {
    organizationId: string;
    userId?: string;
    role: string;
    residencyCountry?: string | null;
    residencyRegion?: string | null;
    registeredFrom?: string | null;
    ip?: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can set organization residency',
        HttpStatus.FORBIDDEN,
      );
    }

    const data: {
      residencyCountry?: string | null;
      residencyRegion?: string | null;
      registeredFrom?: string | null;
    } = {};

    if (input.residencyCountry !== undefined) {
      data.residencyCountry =
        input.residencyCountry === null || input.residencyCountry === ''
          ? null
          : normalizeCountry(input.residencyCountry);
      if (input.residencyCountry && !data.residencyCountry) {
        throw new ApiException(
          'validation_error',
          'residencyCountry must be an ISO 3166-1 alpha-2 code',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (input.residencyRegion !== undefined) {
      data.residencyRegion = input.residencyRegion?.trim() || null;
    }
    if (input.registeredFrom !== undefined) {
      data.registeredFrom =
        input.registeredFrom === null || input.registeredFrom === ''
          ? null
          : normalizeCountry(input.registeredFrom);
      if (input.registeredFrom && !data.registeredFrom) {
        throw new ApiException(
          'validation_error',
          'registeredFrom must be an ISO 3166-1 alpha-2 code',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (
      data.residencyCountry &&
      data.residencyRegion === undefined &&
      input.residencyRegion === undefined
    ) {
      data.residencyRegion = regionLabelForCountry(data.residencyCountry);
    }

    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data,
      select: {
        id: true,
        residencyCountry: true,
        residencyRegion: true,
        registeredFrom: true,
        dataRegion: true,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'organization.identity_residency_set',
      route: 'PATCH /v1/residency/organization',
      ip: input.ip,
      metadata: data,
    });

    return {
      organizationId: updated.id,
      residencyCountry: updated.residencyCountry,
      residencyRegion: updated.residencyRegion,
      registeredFrom: updated.registeredFrom,
      dataRegion: updated.dataRegion,
    };
  }

  /**
   * Prefer models whose hostedRegion / dataCenter matches user residency affinity.
   * Honest affinity: documents preference; does not refuse non-matching hosts.
   */
  async selectModelsByResidency(input: {
    feature: string;
    userId?: string;
    organizationId?: string;
    residencyCountry?: string | null;
    limit?: number;
  }) {
    let country = normalizeCountry(input.residencyCountry);
    if (!country && input.userId && input.organizationId) {
      const combined = await this.getCombined({
        userId: input.userId,
        organizationId: input.organizationId,
      });
      country = combined.effective.residencyCountry;
    }

    const affinity: HostedRegionAffinity = affinityForCountry(country);
    const preferredDc = preferredDataCenterForCountry(country);

    const ready = await this.prisma.modelRegistryEntry.findMany({
      where: { feature: input.feature, status: 'ready' },
      orderBy: [{ kind: 'asc' }, { slug: 'asc' }],
    });

    const scored = ready.map((m) => {
      let score = 0;
      if (m.dataCenter === preferredDc.code) score += 100;
      if (m.hostedRegion === affinity) score += 50;
      if (m.kind === 'lugemi') score += 20;
      if (m.hostedRegion === 'af' && affinity === 'af') score += 10;
      return { model: m, score };
    });

    scored.sort((a, b) => b.score - a.score || a.model.slug.localeCompare(b.model.slug));
    const limit = Math.max(1, Math.min(input.limit ?? 10, 50));
    const selected = scored.slice(0, limit);

    return {
      feature: input.feature,
      residencyCountry: country,
      preferredAffinity: affinity,
      preferredDataCenter: preferredDc,
      affinityNote:
        'Selector prefers models hosted near person/org residency when ready; falls back by score.',
      selected: selected.map((s) => ({
        id: s.model.id,
        slug: s.model.slug,
        displayName: s.model.displayName,
        kind: s.model.kind,
        hostedResidency: s.model.hostedResidency,
        dataCenter: s.model.dataCenter,
        hostedRegion: s.model.hostedRegion,
        score: s.score,
        servingFrom: s.model.hostedResidency ?? s.model.dataCenter ?? 'unknown',
      })),
    };
  }

  /** Seed helper used when creating users/orgs without explicit residency. */
  seedFromSignupCountry(country?: string | null): ResidencyFields {
    const registeredFrom = normalizeCountry(country);
    if (!registeredFrom) {
      return { residencyCountry: null, residencyRegion: null, registeredFrom: null };
    }
    return {
      residencyCountry: registeredFrom,
      residencyRegion: regionLabelForCountry(registeredFrom),
      registeredFrom,
    };
  }

  hostingForSlug(slug: string) {
    return defaultHostingForModelSlug(slug);
  }
}
