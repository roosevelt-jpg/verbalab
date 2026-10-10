import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';

export const PILOT_ORG_TYPES = ['un-agency', 'ngo', 'government', 'health', 'education', 'enterprise', 'other'] as const;
export const PILOT_USE_CASES = ['listen-live', 'messages', 'documents', 'other'] as const;
export const PILOT_STATUSES = ['new', 'contacted', 'pilot', 'closed'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PilotRequestInput {
  name?: unknown;
  email?: unknown;
  organization?: unknown;
  orgType?: unknown;
  country?: unknown;
  languages?: unknown;
  useCase?: unknown;
  message?: unknown;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

@Injectable()
export class PilotRequestsService {
  private readonly logger = new Logger(PilotRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: PilotRequestInput, ip: string | null) {
    const name = text(input.name, 120);
    const email = text(input.email, 200).toLowerCase();
    const organization = text(input.organization, 200);
    const orgType = oneOf(input.orgType, PILOT_ORG_TYPES);
    const useCase = oneOf(input.useCase, PILOT_USE_CASES);
    if (!name || !organization || !orgType || !useCase) {
      throw new ApiException(
        'validation_error',
        'Name, organization, organization type and use case are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!EMAIL_RE.test(email)) {
      throw new ApiException('validation_error', 'A valid email address is required', HttpStatus.BAD_REQUEST);
    }

    const row = await this.prisma.pilotRequest.create({
      data: {
        name,
        email,
        organization,
        orgType,
        useCase,
        country: text(input.country, 120) || null,
        languages: text(input.languages, 500) || null,
        message: text(input.message, 4000) || null,
        ip,
      },
      select: { id: true },
    });
    this.logger.log(`Pilot request ${row.id} from ${organization} (${orgType}, ${useCase})`);
    return { ok: true };
  }

  list(status?: string) {
    const where = oneOf(status, PILOT_STATUSES) ? { status } : {};
    return this.prisma.pilotRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        orgType: true,
        country: true,
        languages: true,
        useCase: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async setStatus(id: string, status: unknown) {
    const next = oneOf(status, PILOT_STATUSES);
    if (!next) {
      throw new ApiException('validation_error', `status must be one of ${PILOT_STATUSES.join(', ')}`, HttpStatus.BAD_REQUEST);
    }
    const existing = await this.prisma.pilotRequest.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ApiException('not_found', 'Pilot request not found', HttpStatus.NOT_FOUND);
    return this.prisma.pilotRequest.update({ where: { id }, data: { status: next }, select: { id: true, status: true } });
  }
}
