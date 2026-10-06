import { Injectable } from '@nestjs/common';
import { globalPolicyEngineCatalog } from './global-policy-engine.catalog';

@Injectable()
export class GlobalPolicyEngineService {
  engine() {
    return globalPolicyEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const policies = catalog.policies.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      policies,
      count: policies.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'global-policy-engine',
      count: catalog.policies.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Global Policy Engine monitoring snapshot.',
    };
  }
}
