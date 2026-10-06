import { Injectable } from '@nestjs/common';
import { finopsPlatformEngineCatalog } from './finops-platform.catalog';

@Injectable
export class FinopsPlatformService {
  engine {
    return finopsPlatformEngineCatalog;
  }

  list(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const costs = catalog.costs.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      costs,
      count: costs.length,
      budgets: catalog.budgets,
      alerts: catalog.alerts,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  budgets {
    const catalog = this.engine;
    return {
      budgets: catalog.budgets,
      count: catalog.budgets.length,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      note: 'FinOps budgets including GPU/model cost budgets paired with Volume 7.',
      docs: catalog.docs,
    };
  }

  alerts {
    const catalog = this.engine;
    const gpuAlerts = catalog.alerts.filter((a) => a.kind === 'gpu' && a.enabled);
    return {
      alerts: catalog.alerts,
      gpuAlerts,
      gpuBudgetAlertsEnabled: true,
      enabledCount: catalog.alerts.filter((a) => a.enabled).length,
      honesty: catalog.honesty,
      note: 'GPU budget alerts enabled — Volume 7 pairing.',
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'finops',
      costCount: catalog.costs.length,
      budgetCount: catalog.budgets.length,
      alertCount: catalog.alerts.length,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'FinOps Platform monitoring snapshot.',
    };
  }
}
