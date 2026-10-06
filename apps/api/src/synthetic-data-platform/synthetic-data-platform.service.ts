import { Injectable } from '@nestjs/common';
import { syntheticDataPlatformEngineCatalog } from './synthetic-data-platform.catalog';

@Injectable
export class SyntheticDataPlatformService {
  engine {
    return syntheticDataPlatformEngineCatalog;
  }

  artifacts(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const artifacts = catalog.artifacts.filter((a) => {
      if (!q) return true;
      return (
        a.id.toLowerCase.includes(q) ||
        a.name.toLowerCase.includes(q) ||
        a.modality.toLowerCase.includes(q) ||
        a.notes.toLowerCase.includes(q)
      );
    });
    return {
      artifacts,
      count: artifacts.length,
      syntheticLabelRequired: true,
      allSynthetic: artifacts.every((a) => a.isSynthetic === true),
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.artifacts(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'synthetic',
      modalityCount: catalog.modalities.length,
      artifactCount: catalog.artifacts.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Synthetic Data Platform monitoring snapshot.',
    };
  }
}
