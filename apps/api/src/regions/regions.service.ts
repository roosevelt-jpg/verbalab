import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import {
  currentRegionCode,
  findRegion,
  isRegionCode,
  regionCatalog
} from './regions.catalog';

@Injectable()
export class RegionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  current() {
    const code = currentRegionCode();
    const def = findRegion(code)!;
    return {
      code: def.code,
      name: def.name,
      flyRegion: def.flyRegion,
      residencyLabel: def.residencyLabel,
      apiBaseUrl: def.apiBaseUrl,
      webBaseUrl: def.webBaseUrl,
      disclaimer:
        'Each region is a separate deploy + database (residency island). Not a global mesh or automatic failover.' };
  }

  list() {
    const current = currentRegionCode();
    return {
      currentRegion: current,
      disclaimer:
        'Pick a residency region for sales/compliance. Data does not replicate across regions.',
      regions: regionCatalog().map((r) => ({
        ...r,
        isCurrentDeploy: r.code === current })) };
  }

  async getOrgResidency(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { id: true, name: true, dataRegion: true } });
    const current = this.current();
    const pinned = org.dataRegion && isRegionCode(org.dataRegion) ? findRegion(org.dataRegion) : null;
    return {
      organizationId: org.id,
      dataRegion: org.dataRegion,
      pinnedRegion: pinned
        ? {
            code: pinned.code,
            name: pinned.name,
            apiBaseUrl: pinned.apiBaseUrl,
            webBaseUrl: pinned.webBaseUrl }
        : null,
      currentDeploy: current,
      matchesCurrentDeploy: !org.dataRegion || org.dataRegion === current.code,
      note: 'Changing dataRegion does not migrate existing rows — provision the target island and import separately.' };
  }

  async setOrgResidency(input: {
    organizationId: string;
    userId?: string;
    role: string;
    dataRegion: string | null;
    ip?: string;
  }) {
    if (input.role !== 'owner') {
      throw new ApiException(
        'forbidden',
        'Only the organization owner can set data residency',
        HttpStatus.FORBIDDEN,
      );
    }

    let next: string | null = null;
    if (input.dataRegion !== null && input.dataRegion !== '') {
      if (!isRegionCode(input.dataRegion)) {
        throw new ApiException(
          'validation_error',
          'dataRegion must be us, eu, or null',
          HttpStatus.BAD_REQUEST,
        );
      }
      next = input.dataRegion;
    }

    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: { dataRegion: next },
      select: { id: true, dataRegion: true } });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'organization.residency_set',
      route: 'PATCH /v1/organization/residency',
      ip: input.ip,
      metadata: { dataRegion: next } });

    return this.getOrgResidency(updated.id);
  }

  /**
   * Enforce residency pin: org pinned to another island must not use this deploy's DB.
   */
  async assertOrgMatchesDeploy(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { dataRegion: true, name: true } });
    if (!org?.dataRegion) return;

    const current = currentRegionCode();
    if (org.dataRegion === current) return;

    const target = findRegion(org.dataRegion);
    throw new ApiException(
      'residency_mismatch',
      `Organization is pinned to region "${org.dataRegion}" (${target?.residencyLabel ?? org.dataRegion}). Use ${target?.apiBaseUrl ?? 'the matching regional API'} — this deploy is "${current}".`,
      HttpStatus.FORBIDDEN,
    );
  }
}
