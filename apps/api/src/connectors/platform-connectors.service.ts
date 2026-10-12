import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  findPlatformConnector,
  platformConnectorGuide,
  platformConnectorsEngine,
} from './platform-connectors.catalog';
import {
  type ConnectorCredentials,
  decryptConnectorCredentials,
  encryptConnectorCredentials,
  isEncryptedConnectorSecrets,
} from './connector-crypto';
import { verifyConnectorCredentials } from './connector-auth.probes';

export type ConnectPlatformBody = ConnectorCredentials;

@Injectable()
export class PlatformConnectorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return platformConnectorsEngine();
  }

  list(category?: string) {
    const engine = platformConnectorsEngine();
    const connectors = category
      ? engine.connectors.filter((c) => c.category === category)
      : engine.connectors;
    return {
      product: engine.product,
      note: engine.note,
      categories: engine.categories,
      apis: engine.apis,
      connectors,
      console: engine.console,
      docs: engine.docs,
      sdk: engine.sdk,
    };
  }

  get(id: string) {
    const entry = findPlatformConnector(id);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${id}`);
    }
    return platformConnectorGuide(entry);
  }

  demo(id: string, body?: { text?: string; source?: string; target?: string }) {
    const entry = findPlatformConnector(id);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${id}`);
    }
    const text = (body?.text ?? 'Hello').slice(0, 500);
    const source = body?.source ?? 'en';
    const target = body?.target ?? 'ak';
    return {
      connectorId: entry.id,
      name: entry.name,
      ok: true,
      message: `${entry.name} demo hook accepted. Wire live credentials via Studio Connectors (realtime auth) or env (${entry.envHint}).`,
      sample: {
        text,
        source,
        target,
        suggestedCalls: entry.lugemiApis.map((api) => api),
      },
      next: {
        translate: { method: 'POST', path: '/v1/translate', body: { text, source, target } },
        tts: {
          method: 'POST',
          path: '/v1/tts/synthesize',
          body: { text, voice: 'own:ak-gh-female' },
        },
        stt: { method: 'POST', path: '/v1/speech/recognize' },
        voiceClone: { method: 'GET', path: '/v1/voice-clones' },
        realtime: { method: 'POST', path: '/v1/speech/stream' },
        guide: { method: 'GET', path: `/v1/connectors/platform/${entry.id}` },
        connect: { method: 'POST', path: `/v1/connectors/platform/${entry.id}/connect` },
      },
      integrationGuide: entry.integrationGuide,
      console: `/connectors#${entry.id}`,
    };
  }

  private assertManager(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage platform connector connections',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private normalizeCredentials(body: ConnectPlatformBody): ConnectorCredentials {
    const trim = (v?: string) => {
      const t = v?.trim();
      return t ? t : undefined;
    };
    return {
      apiKey: trim(body.apiKey),
      webhookUrl: trim(body.webhookUrl),
      accountSid: trim(body.accountSid),
      projectId: trim(body.projectId),
      teamId: trim(body.teamId),
      teamName: trim(body.teamName),
    };
  }

  private hasAnyCredential(creds: ConnectorCredentials): boolean {
    return Boolean(
      creds.apiKey ||
        creds.accountSid ||
        creds.projectId ||
        creds.webhookUrl ||
        creds.teamId,
    );
  }

  async listConnections(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.platformConnectorConnection.findMany({
      where: { organizationId, workspaceId, status: 'connected' },
      orderBy: { verifiedAt: 'desc' },
      select: {
        id: true,
        connectorId: true,
        status: true,
        authProvider: true,
        verifyNote: true,
        verifiedAt: true,
        lastVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      connections: rows.map((r) => ({
        id: r.id,
        connectorId: r.connectorId,
        status: r.status,
        authProvider: r.authProvider,
        verifyNote: r.verifyNote,
        verifiedAt: r.verifiedAt.toISOString(),
        lastVerifiedAt: r.lastVerifiedAt.toISOString(),
        connected: true,
        connectedAt: r.verifiedAt.getTime(),
      })),
    };
  }

  async connect(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    role: string;
    connectorId: string;
    body: ConnectPlatformBody;
    ip?: string;
  }) {
    this.assertManager(input.role);

    const entry = findPlatformConnector(input.connectorId);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${input.connectorId}`);
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: input.workspaceId, organizationId: input.organizationId },
    });
    if (!workspace) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }

    const creds = this.normalizeCredentials(input.body);
    if (!this.hasAnyCredential(creds)) {
      throw new ApiException(
        'validation_error',
        'Realtime auth requires credentials. Soft-connect without a vendor key is not allowed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const probe = await verifyConnectorCredentials(entry.id, creds);
    if (!probe.ok) {
      throw new ApiException(
        'connector_auth_failed',
        probe.note,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const now = new Date();
    const sealed = encryptConnectorCredentials(creds);
    const row = await this.prisma.platformConnectorConnection.upsert({
      where: {
        workspaceId_connectorId: {
          workspaceId: input.workspaceId,
          connectorId: entry.id,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        connectorId: entry.id,
        credentialsEnc: sealed as unknown as Prisma.InputJsonValue,
        status: 'connected',
        authProvider: probe.provider,
        verifyNote: probe.note,
        verifiedAt: now,
        lastVerifiedAt: now,
      },
      update: {
        organizationId: input.organizationId,
        credentialsEnc: sealed as unknown as Prisma.InputJsonValue,
        status: 'connected',
        authProvider: probe.provider,
        verifyNote: probe.note,
        verifiedAt: now,
        lastVerifiedAt: now,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector.platform.connected',
      route: `POST /v1/connectors/platform/${entry.id}/connect`,
      ip: input.ip,
      metadata: {
        connectorId: entry.id,
        authProvider: probe.provider,
        connectionId: row.id,
      },
    });

    return {
      ok: true,
      connected: true,
      connectorId: entry.id,
      name: entry.name,
      authProvider: probe.provider,
      verifyNote: probe.note,
      verifiedAt: row.verifiedAt.toISOString(),
      lastVerifiedAt: row.lastVerifiedAt.toISOString(),
      connectionId: row.id,
      message: `${entry.name} connected after realtime auth with ${probe.provider}.`,
    };
  }

  async disconnect(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    role: string;
    connectorId: string;
    ip?: string;
  }) {
    this.assertManager(input.role);

    const entry = findPlatformConnector(input.connectorId);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${input.connectorId}`);
    }

    const existing = await this.prisma.platformConnectorConnection.findUnique({
      where: {
        workspaceId_connectorId: {
          workspaceId: input.workspaceId,
          connectorId: entry.id,
        },
      },
    });

    if (!existing || existing.status !== 'connected') {
      return {
        ok: true,
        connected: false,
        connectorId: entry.id,
        message: `${entry.name} was not connected.`,
      };
    }

    await this.prisma.platformConnectorConnection.update({
      where: { id: existing.id },
      data: {
        status: 'revoked',
        credentialsEnc: { revoked: true } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector.platform.disconnected',
      route: `DELETE /v1/connectors/platform/${entry.id}/connection`,
      ip: input.ip,
      metadata: { connectorId: entry.id, connectionId: existing.id },
    });

    return {
      ok: true,
      connected: false,
      connectorId: entry.id,
      message: `${entry.name} disconnected.`,
    };
  }

  async reverify(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    role: string;
    connectorId: string;
    ip?: string;
  }) {
    this.assertManager(input.role);

    const entry = findPlatformConnector(input.connectorId);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${input.connectorId}`);
    }

    const existing = await this.prisma.platformConnectorConnection.findUnique({
      where: {
        workspaceId_connectorId: {
          workspaceId: input.workspaceId,
          connectorId: entry.id,
        },
      },
    });
    if (!existing || existing.status !== 'connected') {
      throw new ApiException(
        'not_found',
        `${entry.name} is not connected`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!isEncryptedConnectorSecrets(existing.credentialsEnc)) {
      throw new ApiException(
        'connector_auth_failed',
        'Stored credentials are missing or invalid. Reconnect with a live vendor key.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const creds = decryptConnectorCredentials(existing.credentialsEnc);
    const probe = await verifyConnectorCredentials(entry.id, creds);
    const now = new Date();

    if (!probe.ok) {
      await this.prisma.platformConnectorConnection.update({
        where: { id: existing.id },
        data: {
          status: 'revoked',
          verifyNote: probe.note,
          lastVerifiedAt: now,
          credentialsEnc: { revoked: true } as Prisma.InputJsonValue,
        },
      });
      throw new ApiException(
        'connector_auth_failed',
        probe.note,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const row = await this.prisma.platformConnectorConnection.update({
      where: { id: existing.id },
      data: {
        authProvider: probe.provider,
        verifyNote: probe.note,
        lastVerifiedAt: now,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector.platform.reverified',
      route: `POST /v1/connectors/platform/${entry.id}/reverify`,
      ip: input.ip,
      metadata: { connectorId: entry.id, connectionId: row.id },
    });

    return {
      ok: true,
      connected: true,
      connectorId: entry.id,
      authProvider: probe.provider,
      verifyNote: probe.note,
      lastVerifiedAt: row.lastVerifiedAt.toISOString(),
      message: `${entry.name} realtime auth still valid.`,
    };
  }
}
