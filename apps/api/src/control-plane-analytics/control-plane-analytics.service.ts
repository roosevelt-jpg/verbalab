import { Injectable } from '@nestjs/common';
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
          note: 'Cost analytics handoff to FinOps Platform.',
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
      note: 'Control Plane Analytics monitoring snapshot.',
    };
  }
}
