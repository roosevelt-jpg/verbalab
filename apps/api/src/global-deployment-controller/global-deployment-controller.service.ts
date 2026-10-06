import { BadRequestException, Injectable } from '@nestjs/common';
import { globalDeploymentControllerEngineCatalog } from './global-deployment-controller.catalog';

@Injectable
export class GlobalDeploymentControllerService {
  engine {
    return globalDeploymentControllerEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const deployments = catalog.deployments.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
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
    const catalog = this.engine;
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
        input.authorizationToken.trim.length > 0);
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
    const catalog = this.engine;
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

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'global-deployment-controller',
      count: catalog.deployments.length,
      rollbackCount: catalog.rollbackCatalog.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Global Deployment Controller monitoring snapshot.',
    };
  }
}
