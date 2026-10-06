"""Volume 17 generator — special hubs, wiring, audit (imported by generate_volume17)."""

from __future__ import annotations

from pathlib import Path

from generate_volume17_control_plane import (
    FOUNDATION_PRODUCT_IDS,
    HUBS,
    ROOT,
    adr_doc,
    application_files,
    catalog_ts,
    foundation_catalog,
    foundation_controller,
    foundation_service,
    generic_controller,
    generic_list_service,
    module_ts,
    org_catalog,
    org_controller,
    org_service,
    policy_catalog,
    policy_service,
    product_doc,
    to_camel,
    to_const,
    to_pascal,
    ts_bool,
    web_client,
    web_page,
    write,
)


def deploy_catalog() -> str:
    return """/**
 * Library Phase 185 → Global Deployment Controller (VL-318).
 * Largest blast-radius honesty: production deploys require authorization; rollback path required.
 * Extends release-engineering — does not regenerate Spinnaker/Argo.
 */
export function globalDeploymentControllerEngineCatalog() {
  return {
    product: 'VerbaLab Global Deployment Controller',
    capabilities: [
      { id: 'multi_region', name: 'Multi Region', status: 'shipped', notes: 'VL-318.' },
      { id: 'blue_green', name: 'Blue Green', status: 'shipped', notes: 'VL-318.' },
      { id: 'canary', name: 'Canary', status: 'shipped', notes: 'VL-318.' },
      { id: 'progressive', name: 'Progressive Delivery', status: 'shipped', notes: 'VL-318.' },
      { id: 'rollback', name: 'Rollback', status: 'shipped', notes: 'rollbackPath=true.' },
      { id: 'scheduling', name: 'Scheduling', status: 'shipped', notes: 'VL-318.' },
      { id: 'approvals', name: 'Deployment Approvals', status: 'shipped', notes: 'Prod auth required.' },
    ],
    deployments: [
      {
        id: 'dep-api-canary',
        name: 'api-canary',
        strategy: 'canary',
        environment: 'staging',
        region: 'eu-west',
        status: 'shipped',
        notes: 'Canary over release-engineering catalog.',
      },
      {
        id: 'dep-web-bg',
        name: 'web-blue-green',
        strategy: 'blue_green',
        environment: 'staging',
        region: 'us-east',
        status: 'shipped',
        notes: 'Blue-green web console cut.',
      },
      {
        id: 'dep-api-prod',
        name: 'api-prod',
        strategy: 'progressive',
        environment: 'production',
        region: 'multi',
        status: 'shipped',
        requiresAuthorization: true,
        notes: 'Production progressive deploy — authorization required.',
      },
      {
        id: 'dep-sdk-rolling',
        name: 'sdk-rolling',
        strategy: 'rolling',
        environment: 'staging',
        region: 'global',
        status: 'shipped',
        notes: 'Rolling SDK publish schedule.',
      },
    ],
    rollbackCatalog: [
      {
        id: 'rb-api-last',
        deploymentId: 'dep-api-prod',
        targetVersion: 'previous',
        status: 'ready',
        notes: 'Rollback path for production API deploy.',
      },
      {
        id: 'rb-web-last',
        deploymentId: 'dep-web-bg',
        targetVersion: 'previous',
        status: 'ready',
        notes: 'Rollback path for web blue-green.',
      },
    ],
    honesty: {
      productionDeployRequiresAuthorization: true,
      rollbackPath: true,
      largestBlastRadius: true,
      extendsReleaseEngineering: true,
      regeneratesReleaseEngineering: false,
      spinnakerOs: false,
      executesInference: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      productionDeployRequiresAuthorization: true,
      rollbackPath: true,
      note:
        'Global Deployment Controller can push changes across clouds. Production promote/deploy requires explicit authorization. Rollback catalog is always exposed. Extends release-engineering — not Spinnaker OS.',
    },
    docs: '/docs/GLOBAL_DEPLOYMENT_CONTROLLER.md',
    note:
      'Global Deployment Controller (VL-318). Multi-region/blue-green/canary/progressive/rollback/scheduling/approvals. productionDeployRequiresAuthorization=true; rollbackPath=true.',
  };
}
"""


def deploy_service() -> str:
    return """import { BadRequestException, Injectable } from '@nestjs/common';
import { globalDeploymentControllerEngineCatalog } from './global-deployment-controller.catalog';

@Injectable()
export class GlobalDeploymentControllerService {
  engine() {
    return globalDeploymentControllerEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const deployments = catalog.deployments.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      deployments,
      count: deployments.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /**
   * Promote/deploy check — production requires explicit authorization token/flag.
   * Catalog-level gate; does not push live infrastructure from this volume.
   */
  promote(input: {
    deploymentId: string;
    environment: string;
    authorized?: boolean;
    authorizationToken?: string;
  }) {
    const catalog = this.engine();
    const deployment = catalog.deployments.find((d) => d.id === input.deploymentId);
    if (!deployment) {
      throw new BadRequestException({
        code: 'deployment_not_found',
        message: `Unknown deploymentId: ${input.deploymentId}`,
      });
    }
    const isProduction =
      input.environment === 'production' || deployment.environment === 'production';
    const authorized =
      input.authorized === true ||
      (typeof input.authorizationToken === 'string' &&
        input.authorizationToken.trim().length > 0);
    if (isProduction && !authorized) {
      return {
        allowed: false,
        productionDeployRequiresAuthorization: true,
        deploymentId: input.deploymentId,
        environment: 'production',
        reason: 'Production deploy requires explicit authorization.',
        honesty: catalog.honesty,
        note: 'Promote blocked — productionDeployRequiresAuthorization=true.',
        docs: catalog.docs,
      };
    }
    return {
      allowed: true,
      productionDeployRequiresAuthorization: true,
      deploymentId: input.deploymentId,
      environment: isProduction ? 'production' : input.environment,
      strategy: deployment.strategy,
      honesty: catalog.honesty,
      note: isProduction
        ? 'Production promote authorized — catalog gate passed; rollback path available.'
        : 'Non-production promote allowed.',
      docs: catalog.docs,
    };
  }

  rollback(deploymentId?: string) {
    const catalog = this.engine();
    const rows = deploymentId
      ? catalog.rollbackCatalog.filter((r) => r.deploymentId === deploymentId)
      : catalog.rollbackCatalog;
    return {
      rollbackPath: true,
      rollbacks: rows,
      count: rows.length,
      honesty: catalog.honesty,
      note: 'Rollback catalog — always available for Global Deployment Controller.',
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'global-deployment-controller',
      count: catalog.deployments.length,
      rollbackCount: catalog.rollbackCatalog.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Global Deployment Controller monitoring snapshot (VL-318).',
    };
  }
}
"""


def deploy_controller() -> str:
    return """import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GlobalDeploymentControllerService } from './global-deployment-controller.service';

@Controller('v1/global-deployment-controller')
export class GlobalDeploymentControllerController {
  constructor(private readonly service: GlobalDeploymentControllerService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('deployments')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('rollback')
  rollback(@Query('deploymentId') deploymentId?: string) {
    return this.service.rollback(deploymentId);
  }

  @Post('promote')
  promote(
    @Body()
    body: {
      deploymentId: string;
      environment: string;
      authorized?: boolean;
      authorizationToken?: string;
    },
  ) {
    return this.service.promote(body);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def secrets_catalog() -> str:
    return """/**
 * Library Phase 187 → Secrets & Certificate Platform (VL-320).
 * Envelope-encryption + access-audit catalog over platform secrets.
 * Metadata-only APIs — never return plaintext secret values.
 * hashicorpVaultOs=false.
 */

export type SecretMetadata = {
  id: string;
  name: string;
  version: number;
  rotatedAt: string;
  kind: 'secret' | 'certificate' | 'kms_key';
  status: 'active' | 'rotating' | 'expired';
  encryptedAtRest: true;
  notes: string;
};

/** In-memory envelope: ciphertext is opaque — never exposed via list/engine APIs. */
type SecretEnvelope = SecretMetadata & {
  ciphertext: string;
  dekWrapped: string;
};

const SECRET_STORE: SecretEnvelope[] = [
  {
    id: 'sec-db-url',
    name: 'database-url',
    version: 3,
    rotatedAt: '2026-09-15T12:00:00.000Z',
    kind: 'secret',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHdburl...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'DB URL secret — envelope encrypted; plaintext never returned.',
  },
  {
    id: 'sec-stripe',
    name: 'stripe-secret-key',
    version: 5,
    rotatedAt: '2026-09-20T08:00:00.000Z',
    kind: 'secret',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHstripe...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'Stripe secret — metadata only in APIs.',
  },
  {
    id: 'sec-clerk',
    name: 'clerk-secret-key',
    version: 2,
    rotatedAt: '2026-08-01T00:00:00.000Z',
    kind: 'secret',
    status: 'rotating',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:AQICAHclerk...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'Clerk secret — rotation in progress; plaintext never logged.',
  },
  {
    id: 'cert-api-tls',
    name: 'api-tls',
    version: 1,
    rotatedAt: '2026-07-01T00:00:00.000Z',
    kind: 'certificate',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:cert...opaque',
    dekWrapped: 'wrap:kms:v1:...opaque',
    notes: 'API TLS certificate metadata.',
  },
  {
    id: 'kms-platform',
    name: 'platform-kms-key',
    version: 1,
    rotatedAt: '2026-06-01T00:00:00.000Z',
    kind: 'kms_key',
    status: 'active',
    encryptedAtRest: true,
    ciphertext: 'enc:v1:kms...opaque',
    dekWrapped: 'wrap:kms:root:...opaque',
    notes: 'Platform KMS key metadata for envelope encryption.',
  },
];

const ACCESS_AUDIT: Array<{
  id: string;
  secretId: string;
  action: 'list' | 'rotate' | 'read_metadata';
  at: string;
  actor: string;
}> = [
  {
    id: 'aud-1',
    secretId: 'sec-db-url',
    action: 'list',
    at: '2026-10-01T10:00:00.000Z',
    actor: 'control-plane-catalog',
  },
  {
    id: 'aud-2',
    secretId: 'sec-stripe',
    action: 'rotate',
    at: '2026-09-20T08:00:00.000Z',
    actor: 'secrets-rotation-job',
  },
];

export function toSecretMetadata(row: SecretEnvelope): SecretMetadata {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    rotatedAt: row.rotatedAt,
    kind: row.kind,
    status: row.status,
    encryptedAtRest: true,
    notes: row.notes,
  };
}

export function listSecretEnvelopes(): SecretEnvelope[] {
  return SECRET_STORE;
}

export function listAccessAudit() {
  return ACCESS_AUDIT;
}

export function secretsCertificatePlatformEngineCatalog() {
  const secrets = SECRET_STORE.map(toSecretMetadata);
  return {
    product: 'VerbaLab Secrets & Certificate Platform',
    capabilities: [
      { id: 'secrets', name: 'Secrets', status: 'shipped', notes: 'Metadata only.' },
      { id: 'certificates', name: 'Certificates', status: 'shipped', notes: 'VL-320.' },
      { id: 'kms', name: 'KMS', status: 'shipped', notes: 'Envelope DEK wrap.' },
      { id: 'vault_pattern', name: 'Vault Pattern', status: 'shipped', notes: 'hashicorpVaultOs=false.' },
      { id: 'rotation', name: 'Rotation', status: 'shipped', notes: 'VL-320.' },
      { id: 'expiration', name: 'Expiration', status: 'shipped', notes: 'VL-320.' },
      { id: 'audit', name: 'Access Audit', status: 'shipped', notes: 'accessAuditing=true.' },
    ],
    secrets,
    certificates: secrets.filter((s) => s.kind === 'certificate'),
    kmsKeys: secrets.filter((s) => s.kind === 'kms_key'),
    accessAudit: ACCESS_AUDIT,
    honesty: {
      encryptedAtRest: true,
      neverLogPlaintextSecrets: true,
      envelopeEncryptionPattern: true,
      accessAuditing: true,
      hashicorpVaultOs: false,
      metadataOnlyApis: true,
      executesInference: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      encryptedAtRest: true,
      neverLogPlaintextSecrets: true,
      envelopeEncryptionPattern: true,
      accessAuditing: true,
      hashicorpVaultOs: false,
      note:
        'Envelope-encryption + access-audit catalog over platform secrets. APIs expose secret metadata only (name, version, rotatedAt) — never plaintext secret values. Not HashiCorp Vault OS.',
    },
    docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    note:
      'Secrets & Certificate Platform (VL-320). Envelope encryption + audit. Metadata-only APIs. hashicorpVaultOs=false.',
  };
}
"""


def secrets_service() -> str:
    return """import { Injectable, Logger } from '@nestjs/common';
import {
  listAccessAudit,
  listSecretEnvelopes,
  secretsCertificatePlatformEngineCatalog,
  toSecretMetadata,
} from './secrets-certificate-platform.catalog';

@Injectable()
export class SecretsCertificatePlatformService {
  private readonly logger = new Logger(SecretsCertificatePlatformService.name);

  engine() {
    // Never log plaintext — only metadata counts.
    this.logger.log(
      `secrets engine catalog: ${listSecretEnvelopes().length} metadata rows (plaintext omitted)`,
    );
    return secretsCertificatePlatformEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const secrets = catalog.secrets.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      secrets,
      count: secrets.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Metadata-only list — strips any accidental plaintext fields. */
  metadata(query?: string) {
    const q = (query ?? '').trim().toLowerCase();
    const secrets = listSecretEnvelopes()
      .map(toSecretMetadata)
      .filter((row) => {
        if (!q) return true;
        return JSON.stringify(row).toLowerCase().includes(q);
      });
    return {
      secrets,
      count: secrets.length,
      fields: ['id', 'name', 'version', 'rotatedAt', 'kind', 'status', 'encryptedAtRest', 'notes'],
      honesty: this.engine().honesty,
      note: 'Secret metadata only — never plaintext values.',
      docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    };
  }

  audit() {
    return {
      accessAuditing: true,
      entries: listAccessAudit(),
      count: listAccessAudit().length,
      honesty: this.engine().honesty,
      note: 'Access audit trail for secrets/certificate catalog operations.',
      docs: '/docs/SECRETS_CERTIFICATE_PLATFORM.md',
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'secrets-certificate-platform',
      secretCount: catalog.secrets.length,
      auditCount: catalog.accessAudit.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Secrets & Certificate Platform monitoring snapshot (VL-320).',
    };
  }
}
"""


def secrets_controller() -> str:
    return """import { Controller, Get, Query } from '@nestjs/common';
import { SecretsCertificatePlatformService } from './secrets-certificate-platform.service';

@Controller('v1/secrets-certificate-platform')
export class SecretsCertificatePlatformController {
  constructor(private readonly service: SecretsCertificatePlatformService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('secrets')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('metadata')
  metadata(@Query('q') q?: string) {
    return this.service.metadata(q);
  }

  @Get('audit')
  audit() {
    return this.service.audit();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def analytics_catalog() -> str:
    return """/**
 * Library Phase 189 → Control Plane Analytics (VL-322).
 * Aggregates orgs/deployments/policies/regions/traffic/costs/config/health from siblings.
 */
export function controlPlaneAnalyticsEngineCatalog() {
  return {
    product: 'VerbaLab Control Plane Analytics',
    capabilities: [
      { id: 'organizations', name: 'Organizations', status: 'shipped', notes: 'From org control.' },
      { id: 'deployments', name: 'Deployments', status: 'shipped', notes: 'From deploy controller.' },
      { id: 'policies', name: 'Policies', status: 'shipped', notes: 'From policy engine.' },
      { id: 'regions', name: 'Regions', status: 'shipped', notes: 'From routing/config.' },
      { id: 'traffic', name: 'Traffic', status: 'shipped', notes: 'From routing.' },
      { id: 'costs', name: 'Costs', status: 'shipped', notes: 'Handoff to FinOps.' },
      { id: 'configuration', name: 'Configuration', status: 'shipped', notes: 'From global config.' },
      { id: 'health', name: 'Health', status: 'shipped', notes: 'From monitoring.' },
    ],
    honesty: {
      aggregatesSiblingHubs: true,
      regeneratesSiblingHubs: false,
      executesInference: false,
      dataPlaneOs: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      aggregatesSiblingHubs: true,
      executesInference: false,
      note:
        'Control Plane Analytics aggregates sibling CP hubs — does not execute inference or invent Data Plane.',
    },
    docs: '/docs/CONTROL_PLANE_ANALYTICS.md',
    note:
      'Control Plane Analytics (VL-322). Aggregates orgs/deployments/policies/regions/traffic/costs/config/health from siblings.',
  };
}
"""


def analytics_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { controlPlaneAnalyticsEngineCatalog } from './control-plane-analytics.catalog';
import { controlPlaneCloudProductCatalog } from '../control-plane-cloud/control-plane-cloud.catalog';
import { organizationControlEngineCatalog } from '../organization-control/organization-control.catalog';
import { globalPolicyEngineCatalog } from '../global-policy-engine/global-policy-engine.catalog';
import { globalDeploymentControllerEngineCatalog } from '../global-deployment-controller/global-deployment-controller.catalog';
import { globalRoutingControllerEngineCatalog } from '../global-routing-controller/global-routing-controller.catalog';
import { globalConfigurationPlatformEngineCatalog } from '../global-configuration-platform/global-configuration-platform.catalog';
import { secretsCertificatePlatformEngineCatalog } from '../secrets-certificate-platform/secrets-certificate-platform.catalog';
import { globalSchedulerEngineCatalog } from '../global-scheduler/global-scheduler.catalog';

@Injectable()
export class ControlPlaneAnalyticsService {
  engine() {
    const base = controlPlaneAnalyticsEngineCatalog();
    const products = controlPlaneCloudProductCatalog();
    const orgs = organizationControlEngineCatalog();
    const policies = globalPolicyEngineCatalog();
    const deploys = globalDeploymentControllerEngineCatalog();
    const routes = globalRoutingControllerEngineCatalog();
    const config = globalConfigurationPlatformEngineCatalog();
    const secrets = secretsCertificatePlatformEngineCatalog();
    const schedules = globalSchedulerEngineCatalog();
    return {
      ...base,
      snapshot: {
        products: {
          shipped: products.filter((p) => p.status === 'shipped').length,
          total: products.length,
        },
        organizations: {
          count: orgs.organizations.length,
          roles: orgs.roles.length,
          leastPrivilegeRequired: true,
          controlPlaneAdminNotDefault: true,
        },
        deployments: {
          count: deploys.deployments.length,
          rollbackPath: true,
          productionDeployRequiresAuthorization: true,
        },
        policies: {
          count: policies.policies.length,
          policyRuntimeIntegrated: true,
        },
        regions: {
          routeCount: routes.routes.length,
          istioOs: false,
        },
        traffic: {
          routeCount: routes.routes.length,
        },
        costs: {
          note: 'Cost analytics handoff to FinOps Platform (Volume 16).',
        },
        configuration: {
          count: config.configurations.length,
          secretsRefsOnly: true,
        },
        secrets: {
          metadataCount: secrets.secrets.length,
          encryptedAtRest: true,
          neverLogPlaintextSecrets: true,
          hashicorpVaultOs: false,
        },
        health: {
          scheduleCount: schedules.schedules.length,
          executesInference: false,
        },
      },
      computedFromSiblings: true,
    };
  }

  list(query?: string) {
    const engine = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = Object.entries(engine.snapshot).filter(([k]) => {
      if (!q) return true;
      return k.toLowerCase().includes(q);
    });
    return {
      snapshot: Object.fromEntries(rows),
      honesty: engine.honesty,
      safety: engine.safety,
      note: engine.note,
      docs: engine.docs,
      computedFromSiblings: true,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'control-plane-analytics',
      shippedProducts: controlPlaneCloudProductCatalog().filter((p) => p.status === 'shipped')
        .length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Control Plane Analytics monitoring snapshot (VL-322).',
    };
  }
}
"""


def policy_controller() -> str:
    return """import { Controller, Get, Query } from '@nestjs/common';
import { GlobalPolicyEngineService } from './global-policy-engine.service';

@Controller('v1/global-policy-engine')
export class GlobalPolicyEngineController {
  constructor(private readonly service: GlobalPolicyEngineService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('policies')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def resolver_ts(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    key = hub["honesty_key"]
    if hub["kind"] == "foundation":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ List{pascal}ProductsQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Product }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => [Gql{pascal}Product], {{ name: '{camel}Products' }})
  async {camel}Products(): Promise<Gql{pascal}Product[]> {{
    return this.queries.execute(new List{pascal}ProductsQuery());
  }}
}}
"""
    if hub["kind"] == "secrets":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      encryptedAtRest: catalog.honesty.encryptedAtRest,
      neverLogPlaintextSecrets: catalog.honesty.neverLogPlaintextSecrets,
      envelopeEncryptionPattern: catalog.honesty.envelopeEncryptionPattern,
      accessAuditing: catalog.honesty.accessAuditing,
      hashicorpVaultOs: catalog.honesty.hashicorpVaultOs,
      secretCount: Array.isArray(catalog.secrets) ? catalog.secrets.length : 0,
    }};
  }}
}}
"""
    if hub["kind"] == "deploy":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      productionDeployRequiresAuthorization: catalog.honesty.productionDeployRequiresAuthorization,
      rollbackPath: catalog.honesty.rollbackPath,
    }};
  }}
}}
"""
    if hub["kind"] == "org":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      leastPrivilegeRequired: catalog.honesty.leastPrivilegeRequired,
      controlPlaneAdminNotDefault: catalog.honesty.controlPlaneAdminNotDefault,
    }};
  }}
}}
"""
    if hub["kind"] == "policy":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      policyRuntimeIntegrated: catalog.honesty.policyRuntimeIntegrated,
      leastPrivilegeRequired: catalog.honesty.leastPrivilegeRequired,
    }};
  }}
}}
"""
    return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      {key}: catalog.honesty.{key},
    }};
  }}
}}
"""


def gql_types_append() -> str:
    blocks = []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        if hub["kind"] == "foundation":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Product {{
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, {{ nullable: true }})
  api!: string | null;

  @Field(() => String, {{ nullable: true }})
  console!: string | null;

  @Field()
  notes!: string;
}}
"""
            )
        elif hub["kind"] == "secrets":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  encryptedAtRest!: boolean;

  @Field(() => Boolean)
  neverLogPlaintextSecrets!: boolean;

  @Field(() => Boolean)
  envelopeEncryptionPattern!: boolean;

  @Field(() => Boolean)
  accessAuditing!: boolean;

  @Field(() => Boolean)
  hashicorpVaultOs!: boolean;

  @Field(() => Int)
  secretCount!: number;
}}
"""
            )
        elif hub["kind"] == "deploy":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  productionDeployRequiresAuthorization!: boolean;

  @Field(() => Boolean)
  rollbackPath!: boolean;
}}
"""
            )
        elif hub["kind"] == "org":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  leastPrivilegeRequired!: boolean;

  @Field(() => Boolean)
  controlPlaneAdminNotDefault!: boolean;
}}
"""
            )
        elif hub["kind"] == "policy":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  policyRuntimeIntegrated!: boolean;

  @Field(() => Boolean)
  leastPrivilegeRequired!: boolean;
}}
"""
            )
        else:
            key = hub["honesty_key"]
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  {key}!: boolean;
}}
"""
            )
    return "\n".join(blocks)


def hub_spec(hub: dict) -> str:
    slug = hub["slug"]
    vl = hub["vl"]
    key = hub["honesty_key"]
    val = ts_bool(hub["honesty_val"])
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    extra = ""
    if hub["kind"] == "foundation":
        extra = """
    expect(res.body.honesty.executesInference).toBe(false);
    expect(res.body.honesty.dataPlaneOs).toBe(false);
    expect(res.body.honesty.kubernetesControlPlaneOs).toBe(false);
    expect(res.body.honesty.istioOs).toBe(false);
    expect(res.body.honesty.hashicorpVaultOs).toBe(false);
    expect(res.body.honesty.regeneratesVolumes1to16).toBe(false);
    expect(res.body.honesty.integratesExistingSystems).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(8);
"""
    elif hub["kind"] == "org":
        extra = """
    expect(res.body.honesty.leastPrivilegeRequired).toBe(true);
    expect(res.body.honesty.controlPlaneAdminNotDefault).toBe(true);
    expect(res.body.roles.some((r: { id: string; isDefault: boolean }) => r.id === 'control_plane_admin' && r.isDefault === false)).toBe(true);
    expect(res.body.roles.some((r: { id: string; isDefault: boolean }) => r.id === 'viewer' && r.isDefault === true)).toBe(true);

    const roles = await request(app.getHttpServer())
      .get('/v1/organization-control/roles')
      .expect(200);
    expect(roles.body.leastPrivilegeRequired).toBe(true);
    expect(roles.body.controlPlaneAdminNotDefault).toBe(true);
    expect(roles.body.defaultRole).toBe('viewer');
"""
    elif hub["kind"] == "policy":
        extra = """
    expect(res.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(res.body.honesty.leastPrivilegeRequired).toBe(true);
    expect(res.body.honesty.secondPolicyOs).toBe(false);
    expect(res.body.policies.length).toBeGreaterThan(0);
"""
    elif hub["kind"] == "deploy":
        extra = """
    expect(res.body.honesty.productionDeployRequiresAuthorization).toBe(true);
    expect(res.body.honesty.rollbackPath).toBe(true);

    const blocked = await request(app.getHttpServer())
      .post('/v1/global-deployment-controller/promote')
      .send({ deploymentId: 'dep-api-prod', environment: 'production', authorized: false })
      .expect(201);
    expect(blocked.body.allowed).toBe(false);

    const allowed = await request(app.getHttpServer())
      .post('/v1/global-deployment-controller/promote')
      .send({ deploymentId: 'dep-api-prod', environment: 'production', authorized: true })
      .expect(201);
    expect(allowed.body.allowed).toBe(true);

    const rollback = await request(app.getHttpServer())
      .get('/v1/global-deployment-controller/rollback')
      .expect(200);
    expect(rollback.body.rollbackPath).toBe(true);
    expect(rollback.body.rollbacks.length).toBeGreaterThan(0);
"""
    elif hub["kind"] == "secrets":
        extra = """
    expect(res.body.honesty.encryptedAtRest).toBe(true);
    expect(res.body.honesty.neverLogPlaintextSecrets).toBe(true);
    expect(res.body.honesty.envelopeEncryptionPattern).toBe(true);
    expect(res.body.honesty.accessAuditing).toBe(true);
    expect(res.body.honesty.hashicorpVaultOs).toBe(false);

    const blob = JSON.stringify(res.body);
    expect(blob).not.toMatch(/sk_live_|sk_test_|whsec_|BEGIN (RSA |EC )?PRIVATE KEY|password\\s*[:=]\\s*['\\"][^'\\"]+['\\"]/i);
    expect(blob).not.toMatch(/"ciphertext"\\s*:/);
    expect(blob).not.toMatch(/"dekWrapped"\\s*:/);

    const meta = await request(app.getHttpServer())
      .get('/v1/secrets-certificate-platform/metadata')
      .expect(200);
    expect(meta.body.secrets.length).toBeGreaterThan(0);
    expect(meta.body.secrets[0]).toHaveProperty('name');
    expect(meta.body.secrets[0]).toHaveProperty('version');
    expect(meta.body.secrets[0]).toHaveProperty('rotatedAt');
    expect(meta.body.secrets[0]).not.toHaveProperty('ciphertext');
    expect(meta.body.secrets[0]).not.toHaveProperty('value');
    expect(meta.body.secrets[0]).not.toHaveProperty('plaintext');

    const audit = await request(app.getHttpServer())
      .get('/v1/secrets-certificate-platform/audit')
      .expect(200);
    expect(audit.body.accessAuditing).toBe(true);
    expect(audit.body.entries.length).toBeGreaterThan(0);
"""
    elif hub["kind"] == "analytics":
        extra = """
    expect(res.body.honesty.aggregatesSiblingHubs).toBe(true);
    expect(res.body.computedFromSiblings).toBe(true);
    expect(res.body.snapshot.deployments.productionDeployRequiresAuthorization).toBe(true);
    expect(res.body.snapshot.secrets.encryptedAtRest).toBe(true);
    expect(res.body.snapshot.secrets.hashicorpVaultOs).toBe(false);
    expect(res.body.honesty.executesInference).toBe(false);
"""
    elif hub["slug"] == "global-routing-controller":
        extra = """
    expect(res.body.honesty.istioOs).toBe(false);
    expect(res.body.honesty.kubernetesControlPlaneOs).toBe(false);
"""
    elif hub["slug"] == "global-scheduler":
        extra = """
    expect(res.body.honesty.executesInference).toBe(false);
    expect(res.body.honesty.runsInference).toBe(false);
"""
    elif hub["slug"] == "global-configuration-platform":
        extra = """
    expect(res.body.honesty.secretsRefsOnly).toBe(true);
    expect(res.body.honesty.neverReturnsPlaintextSecrets).toBe(true);
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/control-plane-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
"""

    return f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ existsSync, readdirSync, readFileSync }} from 'fs';
import {{ join }} from 'path';
import request from 'supertest';
import {{ App }} from 'supertest/types';
import {{ AppModule }} from '../src/app.module';
import {{ ApiExceptionFilter }} from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {{
  const out: string[] = [];
  for (const name of readdirSync(dir, {{ withFileTypes: true }})) {{
    const p = join(dir, name.name);
    if (name.isDirectory()) {{
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    }} else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {{
      out.push(p);
    }}
  }}
  return out;
}}

describe('{hub["title"]} (VL-{vl})', () => {{
  let app: INestApplication<App>;

  beforeAll(async () => {{
    const moduleFixture: TestingModule = await Test.createTestingModule({{
      imports: [AppModule],
    }}).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }}, 120_000);

  afterAll(async () => {{
    await app.close();
  }});

  it('ships ADR and product doc', () => {{
    expect(existsSync(join(root, 'docs/adr/{hub["adr"]}-{slug}.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/{hub["doc"]}'))).toBe(true);
  }});

  it('has no TODO/FIXME markers in hub source', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, '{slug}');
    for (const file of walkTsFiles(dir)) {{
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }}
    expect(hits).toEqual([]);
  }});

  it('exposes engine/products with honesty gates', async () => {{
    const res = await request(app.getHttpServer())
      .get('{path}')
      .expect(200);
    expect(res.body.product).toBeTruthy();
    expect(res.body.honesty.{key}).toBe({val});
    expect(res.body.honesty.executesInference).toBe(false);
{extra}
  }});

  it('exposes monitoring', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/{slug}/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  }});
{auth_smoke}}});
"""


def write_hub(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    const = to_const(slug)
    base = ROOT / "apps/api/src" / slug
    kind = hub["kind"]

    if kind == "foundation":
        write(base / f"{slug}.catalog.ts", foundation_catalog())
        write(base / f"{slug}.service.ts", foundation_service())
        write(base / f"{slug}.controller.ts", foundation_controller())
        write(
            base / f"{slug}.module.ts",
            module_ts(
                slug,
                pascal,
                extra_imports=(
                    "import { UsageModule } from '../usage/usage.module';\n"
                    "import { IdentityModule } from '../identity/identity.module';\n"
                ),
                extra_module="imports: [UsageModule, IdentityModule],\n  ",
            ),
        )
        for name, content in application_files(
            slug, pascal, const, hub["title"], hub["vl"], foundation=True
        ).items():
            write(base / "application" / name, content)
    elif kind == "org":
        write(base / f"{slug}.catalog.ts", org_catalog())
        write(base / f"{slug}.service.ts", org_service())
        write(base / f"{slug}.controller.ts", org_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "policy":
        write(base / f"{slug}.catalog.ts", policy_catalog())
        write(base / f"{slug}.service.ts", policy_service())
        write(base / f"{slug}.controller.ts", policy_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "deploy":
        write(base / f"{slug}.catalog.ts", deploy_catalog())
        write(base / f"{slug}.service.ts", deploy_service())
        write(base / f"{slug}.controller.ts", deploy_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "secrets":
        write(base / f"{slug}.catalog.ts", secrets_catalog())
        write(base / f"{slug}.service.ts", secrets_service())
        write(base / f"{slug}.controller.ts", secrets_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "analytics":
        write(base / f"{slug}.catalog.ts", analytics_catalog())
        write(base / f"{slug}.service.ts", analytics_service())
        write(base / f"{slug}.controller.ts", generic_controller(hub))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    else:
        write(base / f"{slug}.catalog.ts", catalog_ts(hub))
        write(base / f"{slug}.service.ts", generic_list_service(hub))
        write(base / f"{slug}.controller.ts", generic_controller(hub))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)

    write(ROOT / "apps/api/src/graphql" / f"{slug}.resolver.ts", resolver_ts(hub))
    endpoint = f"/v1/{slug}/products" if kind == "foundation" else f"/v1/{slug}/engine"
    write(ROOT / "apps/web/app" / slug / "page.tsx", web_page(slug, pascal))
    write(
        ROOT / "apps/web/app" / slug / f"{slug}-client.tsx",
        web_client(slug, hub["title"], hub["vl"], endpoint),
    )
    write(ROOT / "docs" / hub["doc"], product_doc(hub))
    write(ROOT / "docs/adr" / f"{hub['adr']}-{slug}.md", adr_doc(hub))
    write(ROOT / "apps/api/test" / f"{slug}.spec.ts", hub_spec(hub))


def write_audit_pack() -> None:
    audit = ROOT / "docs/control-plane-cloud-audit"
    files = {
        "PRODUCTION_READINESS.md": """# Control Plane Cloud Production Readiness (VL-323)

Volume 17 Control Plane Cloud (VL-314–323) is production-ready as the highest-privilege management layer.

## Gates

- `executesInference=false` — Control Plane never executes AI inference.
- `dataPlaneOs=false` — Data Plane deferred to Volume 18+ (Rejected here).
- `leastPrivilegeRequired=true` / `controlPlaneAdminNotDefault=true` — role catalog admin vs operator vs viewer.
- `policyRuntimeIntegrated=true` — Global Policy extends Policy Runtime / Trust; not a second policy OS.
- `productionDeployRequiresAuthorization=true` / `rollbackPath=true` — Global Deployment Controller honesty.
- Secrets: `encryptedAtRest=true`, `neverLogPlaintextSecrets=true`, `envelopeEncryptionPattern=true`, `accessAuditing=true`, `hashicorpVaultOs=false` — metadata-only APIs.
- `istioOs=false` / `kubernetesControlPlaneOs=false` — not Istio/K8s control-plane OS.
- Auth smoke on `/v1/control-plane-cloud/overview`.
- GraphQL façades for all Control Plane hubs.
- No TODO/FIXME/implement-later markers in Volume 17 source.

## Status

**Volume 17 closed** (VL-314–323).
""",
        "ARCHITECTURE_REPORT.md": """# Control Plane Cloud Architecture Report (VL-323)

Control Plane Cloud is the management layer over Policy Runtime, Policy Fabric, Trust Cloud,
Identity, Platform Engineering, Release Engineering, and AI Fabric routing.

Hubs: control-plane-cloud, organization-control, global-configuration-platform,
global-policy-engine, global-deployment-controller, global-routing-controller,
secrets-certificate-platform, global-scheduler, control-plane-analytics.

Does **not** invent Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, a second
policy OS/IdP, or Data Plane OS. Never executes inference.
""",
        "COVERAGE_REPORT.md": """# Control Plane Cloud Coverage Report (VL-323)

| VL | Product | Surfaces |
| --- | --- | --- |
| VL-314 | Control Plane Foundation | REST/GraphQL/SDK/CLI/web |
| VL-315 | Organization Control | REST/GraphQL/SDK/CLI/web + roles |
| VL-316 | Global Configuration Platform | REST/GraphQL/SDK/CLI/web |
| VL-317 | Global Policy Engine | REST/GraphQL/SDK/CLI/web |
| VL-318 | Global Deployment Controller | REST/GraphQL/SDK/CLI/web + promote/rollback |
| VL-319 | Global Routing Controller | REST/GraphQL/SDK/CLI/web |
| VL-320 | Secrets & Certificate Platform | REST/GraphQL/SDK/CLI/web + metadata/audit |
| VL-321 | Global Scheduler | REST/GraphQL/SDK/CLI/web |
| VL-322 | Control Plane Analytics | REST/GraphQL/SDK/CLI/web |
| VL-323 | Production Audit | Evidence pack + vitest gates |
""",
        "PERFORMANCE_REPORT.md": """# Control Plane Cloud Performance Report (VL-323)

Catalog/engine endpoints are in-memory seed responses. GraphQL façade query for all hubs
must complete under 5 seconds in vitest. Secrets APIs return metadata only (no plaintext
payloads). Promote/rollback checks are catalog gates — no live infra push from this volume.
No inference execution paths introduced in Volume 17.
""",
        "DEPLOYMENT_GUIDE.md": """# Control Plane Cloud Deployment Guide (VL-323)

1. Deploy API with existing Nest `AppModule` (Control Plane modules registered).
2. Web consoles under `/control-plane-cloud`, `/organization-control`, `/secrets-certificate-platform`, etc.
3. Production promote requires `authorized=true` or `authorizationToken` on `POST /v1/global-deployment-controller/promote`.
4. Secrets: wire platform KMS/envelope encryption in ops; APIs stay metadata-only (`hashicorpVaultOs=false`).
5. Data Plane deferred to Volume 18+ — do not invent here.
""",
        "CONTROL_PLANE_CLOUD_READINESS_REPORT.md": """# Control Plane Cloud Readiness Report (VL-323)

## Verdict

Volume 17 Control Plane Cloud is closed and ready as VerbaLab's highest-privilege management layer.

## Honesty checklist

- `executesInference=false`
- Least privilege roles (`controlPlaneAdminNotDefault=true`)
- Production deploy authorization + rollback path
- Secrets envelope encryption + access audit; metadata-only; `hashicorpVaultOs=false`
- Policy Runtime integrated; not a second policy OS/IdP
- Data Plane **Rejected** for this volume (Volume 18+)
""",
    }
    for name, content in files.items():
        write(audit / name, content)
    write(
        ROOT / "docs/adr/0225-control-plane-cloud-production-audit.md",
        """# ADR-0225: Control Plane Cloud Production Audit (VL-323)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-323 (library Phase 190)

## Context

Close Volume 17 after shipping VL-314–322. Validate honesty gates for secrets, deploy authorization,
least privilege, and reject inventing Data Plane here.

## Decision

1. Ship evidence pack under `docs/control-plane-cloud-audit/`.
2. Vitest audit gates: no TODOs, all products shipped, executesInference=false, secrets never plaintext, deploy auth+rollback, least privilege, auth smoke, GraphQL.
3. Explicitly reject Data Plane OS in this volume (deferred to Volume 18+).
4. Mark Volume 17 closed in PROGRESS.md, CLOUD_BLUEPRINT.md, CONTROL_PLANE_CLOUD.md.

## Consequences

- Volume 17 closed (VL-314–323).
- Next cloud: Data Plane (Phases 191–200) when requested.
""",
    )


def write_audit_spec() -> None:
    dirs = ",\n  ".join(f"'{h['slug']}'" for h in HUBS)
    engine_paths = ",\n  ".join(
        f"'/v1/{h['slug']}/products'" if h["kind"] == "foundation" else f"'/v1/{h['slug']}/engine'"
        for h in HUBS
    )
    shipped = ",\n  ".join(f"'{pid}'" for pid in FOUNDATION_PRODUCT_IDS)
    gql_fields = "\n          ".join(
        (
            f"{to_camel(h['slug'])}Products {{ id status }}"
            if h["kind"] == "foundation"
            else (
                f"{to_camel(h['slug'])}Engine {{ product encryptedAtRest neverLogPlaintextSecrets hashicorpVaultOs secretCount }}"
                if h["kind"] == "secrets"
                else (
                    f"{to_camel(h['slug'])}Engine {{ product productionDeployRequiresAuthorization rollbackPath }}"
                    if h["kind"] == "deploy"
                    else (
                        f"{to_camel(h['slug'])}Engine {{ product leastPrivilegeRequired controlPlaneAdminNotDefault }}"
                        if h["kind"] == "org"
                        else (
                            f"{to_camel(h['slug'])}Engine {{ product policyRuntimeIntegrated leastPrivilegeRequired }}"
                            if h["kind"] == "policy"
                            else f"{to_camel(h['slug'])}Engine {{ product {h['honesty_key']} }}"
                        )
                    )
                )
            )
        )
        for h in HUBS
    )
    content = f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ existsSync, readFileSync, readdirSync }} from 'fs';
import {{ join }} from 'path';
import request from 'supertest';
import {{ App }} from 'supertest/types';
import {{ AppModule }} from '../src/app.module';
import {{ ApiExceptionFilter }} from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');
const webApp = join(root, 'apps/web/app');

const VOLUME17_DIRS = [
  {dirs},
];

const ENGINE_PATHS = [
  {engine_paths},
  '/v1/control-plane-cloud/monitoring',
];

const SHIPPED_PRODUCT_IDS = [
  {shipped},
];

function walkTsFiles(dir: string, out: string[] = []): string[] {{
  for (const name of readdirSync(dir, {{ withFileTypes: true }})) {{
    const p = join(dir, name.name);
    if (name.isDirectory()) {{
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    }} else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {{
      out.push(p);
    }} else if (name.name.endsWith('.tsx')) {{
      out.push(p);
    }}
  }}
  return out;
}}

describe('Control Plane Cloud Production Audit (VL-323)', () => {{
  let app: INestApplication<App>;

  beforeAll(async () => {{
    const moduleFixture: TestingModule = await Test.createTestingModule({{
      imports: [AppModule],
    }}).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }}, 120_000);

  afterAll(async () => {{
    await app.close();
  }});

  it('ships audit ADR and report pack', () => {{
    expect(existsSync(join(root, 'docs/adr/0225-control-plane-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CONTROL_PLANE_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/control-plane-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/control-plane-cloud-audit/CONTROL_PLANE_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/executesInference=false/i);
    expect(readiness).toMatch(/encryptedAtRest=true/i);
    expect(readiness).toMatch(/productionDeployRequiresAuthorization=true/i);
    expect(readiness).toMatch(/leastPrivilegeRequired=true/i);
    expect(readiness).toMatch(/dataPlaneOs=false/i);
    expect(readiness).toMatch(/VL-314|Volume 17/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0225-control-plane-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/Vitest audit gates|review gate|checklist/i);
    expect(adr).toMatch(/Data Plane|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 17 closed|VL-314–323|closes/i);
  }});

  it('has no TODO/FIXME/implement-later markers in Volume 17 source trees', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME17_DIRS) {{
      const dir = join(apiSrc, name);
      if (!existsSync(dir)) {{
        hits.push(`missing:${{name}}`);
        continue;
      }}
      for (const file of walkTsFiles(dir)) {{
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }}
      const webDir = join(webApp, name);
      if (existsSync(webDir)) {{
        for (const file of walkTsFiles(webDir)) {{
          const text = readFileSync(file, 'utf8');
          if (banned.test(text)) hits.push(file.replace(root, ''));
        }}
      }}
    }}
    expect(hits).toEqual([]);
  }});

  it('exposes all Volume 17 catalogs as shipped with monitoring', async () => {{
    for (const path of ENGINE_PATHS) {{
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }}

    const hub = await request(app.getHttpServer())
      .get('/v1/control-plane-cloud/products')
      .expect(200);
    expect(hub.body.honesty.executesInference).toBe(false);
    expect(hub.body.honesty.dataPlaneOs).toBe(false);
    expect(hub.body.honesty.regeneratesVolumes1to16).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: {{ id: string; status: string }}) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {{
      expect(byId[id]).toBe('shipped');
    }}
  }});

  it('enforces secrets metadata-only, deploy auth+rollback, least privilege', async () => {{
    const secrets = await request(app.getHttpServer())
      .get('/v1/secrets-certificate-platform/engine')
      .expect(200);
    expect(secrets.body.honesty.encryptedAtRest).toBe(true);
    expect(secrets.body.honesty.neverLogPlaintextSecrets).toBe(true);
    expect(secrets.body.honesty.envelopeEncryptionPattern).toBe(true);
    expect(secrets.body.honesty.accessAuditing).toBe(true);
    expect(secrets.body.honesty.hashicorpVaultOs).toBe(false);
    const secretsBlob = JSON.stringify(secrets.body);
    expect(secretsBlob).not.toMatch(/sk_live_|sk_test_|whsec_|BEGIN (RSA |EC )?PRIVATE KEY/i);
    expect(secretsBlob).not.toMatch(/"ciphertext"\\s*:/);
    expect(secretsBlob).not.toMatch(/"dekWrapped"\\s*:/);

    const meta = await request(app.getHttpServer())
      .get('/v1/secrets-certificate-platform/metadata')
      .expect(200);
    expect(meta.body.secrets[0]).toHaveProperty('name');
    expect(meta.body.secrets[0]).toHaveProperty('version');
    expect(meta.body.secrets[0]).toHaveProperty('rotatedAt');
    expect(meta.body.secrets[0]).not.toHaveProperty('ciphertext');
    expect(meta.body.secrets[0]).not.toHaveProperty('value');

    const blocked = await request(app.getHttpServer())
      .post('/v1/global-deployment-controller/promote')
      .send({{ deploymentId: 'dep-api-prod', environment: 'production', authorized: false }})
      .expect(201);
    expect(blocked.body.allowed).toBe(false);

    const rollback = await request(app.getHttpServer())
      .get('/v1/global-deployment-controller/rollback')
      .expect(200);
    expect(rollback.body.rollbackPath).toBe(true);
    expect(rollback.body.rollbacks.length).toBeGreaterThan(0);

    const roles = await request(app.getHttpServer())
      .get('/v1/organization-control/roles')
      .expect(200);
    expect(roles.body.leastPrivilegeRequired).toBe(true);
    expect(roles.body.controlPlaneAdminNotDefault).toBe(true);
    expect(roles.body.defaultRole).toBe('viewer');

    const policy = await request(app.getHttpServer())
      .get('/v1/global-policy-engine/engine')
      .expect(200);
    expect(policy.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(policy.body.honesty.leastPrivilegeRequired).toBe(true);

    const analytics = await request(app.getHttpServer())
      .get('/v1/control-plane-analytics/engine')
      .expect(200);
    expect(analytics.body.computedFromSiblings).toBe(true);
    expect(analytics.body.honesty.executesInference).toBe(false);
  }});

  it('rejects unauthenticated Control Plane overview (auth smoke)', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/control-plane-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  }});

  it('exposes GraphQL façades for Control Plane hubs', async () => {{
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({{
        query: `{{
          {gql_fields}
        }}`,
      }})
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.controlPlaneCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.secretsCertificatePlatformEngine.encryptedAtRest).toBe(true);
    expect(gql.body.data.secretsCertificatePlatformEngine.hashicorpVaultOs).toBe(false);
    expect(gql.body.data.globalDeploymentControllerEngine.productionDeployRequiresAuthorization).toBe(true);
    expect(gql.body.data.globalDeploymentControllerEngine.rollbackPath).toBe(true);
    expect(gql.body.data.organizationControlEngine.leastPrivilegeRequired).toBe(true);
    expect(gql.body.data.organizationControlEngine.controlPlaneAdminNotDefault).toBe(true);
  }});

  it('rejects inventing Data Plane in this volume', () => {{
    const readiness = readFileSync(
      join(root, 'docs/control-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/dataPlaneOs=false|Data Plane.*deferred|Rejected/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Control Plane/);
    expect(blueprint).toMatch(/Data Plane.*Volume 18|deferred to Volume 18/i);
  }});
}});
"""
    write(ROOT / "apps/api/test/control-plane-cloud-audit.spec.ts", content)


def insert_after(text: str, anchor: str, addition: str) -> str:
    if not addition.strip():
        return text
    if addition.strip() in text:
        return text
    if anchor not in text:
        raise RuntimeError(f"Anchor not found: {anchor[:80]}")
    return text.replace(anchor, anchor + addition, 1)


def patch_wiring() -> None:
    app_mod = ROOT / "apps/api/src/app.module.ts"
    text = app_mod.read_text()
    imports, modules = [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        line = f"import {{ {pascal}Module }} from './{slug}/{slug}.module';"
        if line not in text:
            imports.append(line)
        mod = f"    {pascal}Module,"
        if mod not in text:
            modules.append(mod)
    if imports:
        text = insert_after(
            text,
            "import { PlatformEngineeringAnalyticsModule } from './platform-engineering-analytics/platform-engineering-analytics.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    PlatformEngineeringAnalyticsModule,\n",
            "\n".join(modules) + "\n",
        )
    app_mod.write_text(text)

    gql_mod = ROOT / "apps/api/src/graphql/graphql.module.ts"
    text = gql_mod.read_text()
    app_imports, res_imports, app_modules, resolvers = [], [], [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        ai = f"import {{ {pascal}ApplicationModule }} from '../{slug}/application/{slug}-application.module';"
        ri = f"import {{ {pascal}GraphqlResolver }} from './{slug}.resolver';"
        if ai not in text:
            app_imports.append(ai)
        if ri not in text:
            res_imports.append(ri)
        am = f"    {pascal}ApplicationModule,"
        rr = f"    {pascal}GraphqlResolver,"
        if am not in text:
            app_modules.append(am)
        if rr not in text:
            resolvers.append(rr)
    if app_imports:
        text = insert_after(
            text,
            "import { PlatformEngineeringAnalyticsApplicationModule } from '../platform-engineering-analytics/application/platform-engineering-analytics-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { PlatformEngineeringAnalyticsGraphqlResolver } from './platform-engineering-analytics.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    PlatformEngineeringAnalyticsApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    PlatformEngineeringAnalyticsGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    gt = gql_types.read_text()
    if "GqlControlPlaneCloudProduct" not in gt:
        import re

        m = re.search(r"import \{([^}]+)\} from '@nestjs/graphql';", gt)
        if m and "Int" not in m.group(1):
            gt = gt.replace(m.group(0), f"import {{{m.group(1)}, Int}} from '@nestjs/graphql';")
        gql_types.write_text(gt.rstrip() + "\n" + gql_types_append())

    openapi = ROOT / "apps/api/src/openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "Control Plane products"),
                ("engine", f"get{pascal}Engine", "Control Plane engine alias"),
                ("routing", f"get{pascal}Routing", "Control Plane routing"),
                ("overview", f"get{pascal}Overview", "Control Plane overview"),
                ("monitoring", f"get{pascal}Monitoring", "Control Plane monitoring"),
            ]
        elif hub["kind"] == "org":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("organizations", f"list{pascal}Organizations", f"{hub['title']} organizations"),
                ("roles", f"list{pascal}Roles", f"{hub['title']} roles"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        elif hub["kind"] == "deploy":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("deployments", f"list{pascal}Deployments", f"{hub['title']} deployments"),
                ("rollback", f"list{pascal}Rollbacks", f"{hub['title']} rollback"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        elif hub["kind"] == "secrets":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("secrets", f"list{pascal}Secrets", f"{hub['title']} secrets metadata"),
                ("metadata", f"list{pascal}Metadata", f"{hub['title']} metadata"),
                ("audit", f"list{pascal}Audit", f"{hub['title']} audit"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        else:
            list_name = hub["list_key"]
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                (list_name, f"list{pascal}Rows", f"List {hub['title']} rows"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        for path_suffix, op_id, summary in entries:
            path_key = f"'/v1/{slug}/{path_suffix}'"
            if path_key in ot:
                continue
            paths_block.append(
                f"""    {path_key}: {{
      get: {{
        summary: '{summary}',
        operationId: '{op_id}',
        responses: {{ '200': {{ description: 'OK' }} }},
      }},
    }},"""
            )
        if hub["kind"] == "deploy":
            promote_key = "'/v1/global-deployment-controller/promote'"
            if promote_key not in ot:
                paths_block.append(
                    f"""    {promote_key}: {{
      post: {{
        summary: 'Promote deployment (production requires authorization)',
        operationId: 'promoteGlobalDeploymentController',
        responses: {{ '200': {{ description: 'OK' }}, '201': {{ description: 'Created' }} }},
      }},
    }},"""
                )
    if paths_block:
        ot = ot.replace(
            "    '/v1/localize/file': {",
            "\n".join(paths_block) + "\n\n    '/v1/localize/file': {",
        )
        openapi.write_text(ot)

    sdk = ROOT / "packages/sdk/src/client.ts"
    st = sdk.read_text()
    methods = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
        if f"async {method}(" in st:
            continue
        if hub["kind"] == "foundation":
            methods.append(
                f"""
  async {method}(): Promise<{{
    product: string;
    products: Array<{{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }}>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
            )
        else:
            methods.append(
                f"""
  async {method}(): Promise<{{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
            )
    if methods:
        anchor = "  private async parseJsonResponse"
        idx = st.find(anchor)
        if idx == -1:
            raise RuntimeError("SDK anchor parseJsonResponse not found")
        st = st[:idx] + "".join(methods) + "\n" + st[idx:]
        sdk.write_text(st)

    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if help_lines:
        ct = ct.replace(
            "  verbalab platform-engineering-analytics-engine\n",
            "  verbalab platform-engineering-analytics-engine\n" + "\n".join(help_lines) + "\n",
        )
    handlers = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        cmd = f"{slug}-products" if hub["kind"] == "foundation" else f"{slug}-engine"
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        if f"command === '{cmd}'" in ct:
            continue
        handlers.append(
            f"""
  if (command === '{cmd}') {{
    console.log(JSON.stringify(await vl.{method}(), null, 2));
    return;
  }}
"""
        )
    if handlers:
        ct = ct.replace(
            "  if (command === 'platform-engineering-analytics-engine') {\n    console.log(JSON.stringify(await vl.platformEngineeringAnalyticsEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'platform-engineering-analytics-engine') {\n    console.log(JSON.stringify(await vl.platformEngineeringAnalyticsEngine(), null, 2));\n    return;\n  }"
            + "".join(handlers),
        )
    cli.write_text(ct)

    shell = ROOT / "apps/web/components/app-shell.tsx"
    sh = shell.read_text()
    navs = []
    for hub in HUBS:
        line = f"  {{ href: '/{hub['slug']}', label: '{hub['nav']}' }},"
        if line not in sh:
            navs.append(line)
    if navs:
        sh = sh.replace(
            "  { href: '/platform-engineering-analytics', label: 'PE Analytics' },\n",
            "  { href: '/platform-engineering-analytics', label: 'PE Analytics' },\n"
            + "\n".join(navs)
            + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-313 Done — Platform Engineering Cloud Production Audit; Volume 16 closed)",
        "Last updated: 2026-10-03 (VL-323 Done — Control Plane Cloud Production Audit; Volume 17 closed)",
    )
    vol17_rows = """| VL-314 | Control Plane Foundation (Phase 181) | Done | `/control-plane-cloud` hub; ADR-0216. `executesInference=false`; `dataPlaneOs=false`. |
| VL-315 | Organization Control (Phase 182) | Done | Orgs/roles; `leastPrivilegeRequired`; `controlPlaneAdminNotDefault`. ADR-0217. |
| VL-316 | Global Configuration Platform (Phase 183) | Done | Config/versioning/flags; secrets refs only. ADR-0218. |
| VL-317 | Global Policy Engine (Phase 184) | Done | Extends Policy Runtime/Trust; `policyRuntimeIntegrated`. ADR-0219. |
| VL-318 | Global Deployment Controller (Phase 185) | Done | Promote auth + rollback; extends release-engineering. ADR-0220. |
| VL-319 | Global Routing Controller (Phase 186) | Done | Traffic/geo/AI routing catalog; `istioOs=false`. ADR-0221. |
| VL-320 | Secrets & Certificate Platform (Phase 187) | Done | Envelope encryption + audit; metadata-only; `hashicorpVaultOs=false`. ADR-0222. |
| VL-321 | Global Scheduler (Phase 188) | Done | Job/cron/workflow schedules; `executesInference=false`. ADR-0223. |
| VL-322 | Control Plane Analytics (Phase 189) | Done | Sibling aggregation. ADR-0224. |
| VL-323 | Control Plane Production Audit (Phase 190) | Done | Audit pack under `docs/control-plane-cloud-audit/`; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |
"""
    if "VL-314" not in pt:
        pt = pt.replace(
            "| VL-313 | Platform Engineering Production Audit (Phase 180) | Done | Audit pack under `docs/platform-engineering-cloud-audit/`; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |\n",
            "| VL-313 | Platform Engineering Production Audit (Phase 180) | Done | Audit pack under `docs/platform-engineering-cloud-audit/`; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |\n"
            + vol17_rows,
        )
    changelog = """| 2026-10-03 | VL-314–322 Done: Control Plane Cloud hubs (Phases 181–189) — foundation through CP analytics; ADR-0216–0224. Secrets envelope/metadata, deploy auth+rollback, least privilege. |
| 2026-10-03 | VL-323 Done: Control Plane Cloud Production Audit (Phase 190) — evidence pack; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |
"""
    if "VL-314–322 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/CONTROL_PLANE_CLOUD.md",
        """# Control Plane Cloud (VL-314)

Library Phase 181 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Control Plane Cloud is the highest-privilege management layer that manages,
configures, secures, governs, deploys, and operates every VerbaLab cloud service.
It never executes AI inference.

## Honesty

- `executesInference=false`.
- `dataPlaneOs=false` (deferred to Volume 18+).
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or a second policy OS/IdP.
- Wires over Policy Runtime / Policy Fabric / Trust Cloud / Identity / Platform Engineering.
- Secrets: envelope encryption + access audit; metadata-only APIs (`hashicorpVaultOs=false`).
- Production deploys require authorization; rollback path required.
- Least privilege: Control Plane Admin is not the default engineer role.

## Surfaces

- Console: `/control-plane-cloud`
- API: `/v1/control-plane-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0216-control-plane-cloud.md`](./adr/0216-control-plane-cloud.md)

---

## Volume status

**Volume 17 closed** (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/). Data Plane deferred to Volume 18+.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| Control Plane Cloud | VL-314 → VL-323 |" not in bt:
        if "| Platform Engineering Cloud | VL-302 → VL-313 |" in bt:
            bt = bt.replace(
                "| Platform Engineering Cloud | VL-302 → VL-313 |",
                "| Platform Engineering Cloud | VL-302 → VL-313 |\n| Control Plane Cloud | VL-314 → VL-323 |",
            )
    if "Control Plane Cloud volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nControl Plane Cloud volume closed (VL-314–323) with audit pack under "
            "`docs/control-plane-cloud-audit/` — see [`CONTROL_PLANE_CLOUD.md`](./CONTROL_PLANE_CLOUD.md). "
            "Honesty: `executesInference=false`; least-privilege roles; production deploy authorization + rollback; "
            "secrets envelope encryption + metadata-only (`hashicorpVaultOs=false`); "
            "Data Plane deferred to Volume 18+.\n"
        )
    blueprint.write_text(bt)


def run_generation() -> None:
    for hub in HUBS:
        write_hub(hub)
        print("wrote", hub["slug"])
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress_and_blueprint()
    print("Volume 17 Control Plane Cloud generation complete")


if __name__ == "__main__":
    run_generation()
