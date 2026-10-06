import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  PROMPT_KEYS,
  PromptKey,
  defaultPromptBody,
  isPromptKey,
} from './prompt-defaults';

@Injectable
export class PromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Resolve active DB prompt or code fallback. */
  async resolve(input: {
    organizationId: string;
    workspaceId: string;
    key: PromptKey;
  }): Promise<{ body: string; source: 'database' | 'fallback'; version: number | null }> {
    const prompt = await this.prisma.prompt.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: input.workspaceId,
          key: input.key,
        },
      },
    });

    if (!prompt || prompt.activeVersion == null) {
      return { body: defaultPromptBody(input.key), source: 'fallback', version: null };
    }

    const version = await this.prisma.promptVersion.findUnique({
      where: {
        promptId_version: {
          promptId: prompt.id,
          version: prompt.activeVersion,
        },
      },
    });

    if (!version) {
      return { body: defaultPromptBody(input.key), source: 'fallback', version: null };
    }

    return { body: version.body, source: 'database', version: version.version };
  }

  async list(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.prompt.findMany({
      where: { organizationId, workspaceId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, createdAt: true },
        },
      },
    });
    const byKey = new Map(rows.map((row) => [row.key, row]));

    return PROMPT_KEYS.map((key) => {
      const row = byKey.get(key);
      return {
        key,
        activeVersion: row?.activeVersion ?? null,
        latestVersion: row?.versions[0]?.version ?? null,
        usingFallback: row?.activeVersion == null,
        defaultPreview: defaultPromptBody(key).slice(0, 160),
      };
    });
  }

  async listVersions(input: {
    organizationId: string;
    workspaceId: string;
    key: string;
  }) {
    const key = this.requireKey(input.key);
    const prompt = await this.ensurePrompt({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key,
    });
    const versions = await this.prisma.promptVersion.findMany({
      where: { promptId: prompt.id },
      orderBy: { version: 'desc' },
    });
    return {
      key,
      activeVersion: prompt.activeVersion,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        body: v.body,
        note: v.note,
        createdBy: v.createdBy,
        createdAt: v.createdAt,
        active: prompt.activeVersion === v.version,
      })),
    };
  }

  async createVersion(input: {
    organizationId: string;
    workspaceId: string;
    key: string;
    body: string;
    note?: string;
    activate?: boolean;
    userId?: string;
    role: string;
  }) {
    this.assertAdmin(input.role);
    const key = this.requireKey(input.key);
    const body = input.body?.trim ?? '';
    if (!body) {
      throw new ApiException('validation_error', 'body is required', HttpStatus.BAD_REQUEST);
    }
    if ([...body].length > 32_000) {
      throw new ApiException(
        'validation_error',
        'body exceeds maximum of 32000 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    const prompt = await this.ensurePrompt({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key,
    });

    const latest = await this.prisma.promptVersion.findFirst({
      where: { promptId: prompt.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;

    const created = await this.prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version,
        body,
        note: input.note?.trim || null,
        createdBy: input.userId,
      },
    });

    let activeVersion = prompt.activeVersion;
    if (input.activate !== false) {
      await this.prisma.prompt.update({
        where: { id: prompt.id },
        data: { activeVersion: version },
      });
      activeVersion = version;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt.version_created',
      route: 'POST /v1/prompts/:key/versions',
      metadata: { key, version, activated: input.activate !== false },
    });

    return {
      key,
      version: created.version,
      body: created.body,
      note: created.note,
      activeVersion,
      createdAt: created.createdAt,
    };
  }

  async activate(input: {
    organizationId: string;
    workspaceId: string;
    key: string;
    version: number;
    userId?: string;
    role: string;
  }) {
    this.assertAdmin(input.role);
    const key = this.requireKey(input.key);
    if (!Number.isInteger(input.version) || input.version < 1) {
      throw new ApiException('validation_error', 'version must be a positive integer', HttpStatus.BAD_REQUEST);
    }

    const prompt = await this.prisma.prompt.findUnique({
      where: {
        workspaceId_key: { workspaceId: input.workspaceId, key },
      },
    });
    if (!prompt || prompt.organizationId !== input.organizationId) {
      throw new ApiException('not_found', 'Prompt not found', HttpStatus.NOT_FOUND);
    }

    const version = await this.prisma.promptVersion.findUnique({
      where: {
        promptId_version: { promptId: prompt.id, version: input.version },
      },
    });
    if (!version) {
      throw new ApiException('not_found', 'Prompt version not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.prompt.update({
      where: { id: prompt.id },
      data: { activeVersion: input.version },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt.activated',
      route: 'POST /v1/prompts/:key/activate',
      metadata: { key, version: input.version, previous: prompt.activeVersion },
    });

    return {
      key,
      activeVersion: input.version,
      body: version.body,
    };
  }

  /** Clear active version → code fallback (soft reset). */
  async clearActive(input: {
    organizationId: string;
    workspaceId: string;
    key: string;
    userId?: string;
    role: string;
  }) {
    this.assertAdmin(input.role);
    const key = this.requireKey(input.key);
    const prompt = await this.prisma.prompt.findUnique({
      where: {
        workspaceId_key: { workspaceId: input.workspaceId, key },
      },
    });
    if (!prompt || prompt.organizationId !== input.organizationId) {
      throw new ApiException('not_found', 'Prompt not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.prompt.update({
      where: { id: prompt.id },
      data: { activeVersion: null },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt.fallback_restored',
      route: 'POST /v1/prompts/:key/fallback',
      metadata: { key, previous: prompt.activeVersion },
    });

    return {
      key,
      activeVersion: null,
      body: defaultPromptBody(key),
      usingFallback: true,
    };
  }

  private async ensurePrompt(input: {
    organizationId: string;
    workspaceId: string;
    key: PromptKey;
  }) {
    return this.prisma.prompt.upsert({
      where: {
        workspaceId_key: {
          workspaceId: input.workspaceId,
          key: input.key,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        key: input.key,
      },
      update: {},
    });
  }

  private requireKey(raw: string): PromptKey {
    if (!isPromptKey(raw)) {
      throw new ApiException(
        'validation_error',
        `key must be one of ${PROMPT_KEYS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return raw;
  }

  private assertAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage prompts',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
