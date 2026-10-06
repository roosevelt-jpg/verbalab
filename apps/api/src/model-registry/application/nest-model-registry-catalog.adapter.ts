import { Injectable } from '@nestjs/common';
import { ModelRegistryService } from '../model-registry.service';
import { modelRegistryCapabilities } from '../model-registry.catalog';
import {
  ModelRegistryCatalogPort,
  MrCapabilityRow,
  MrEngineBundle,
} from './ports';

@Injectable
export class NestModelRegistryCatalogAdapter implements ModelRegistryCatalogPort {
  constructor(private readonly registry: ModelRegistryService) {}

  engine: Promise<MrEngineBundle> {
    return this.registry.engine;
  }

  listCapabilities: MrCapabilityRow[] {
    return modelRegistryCapabilities;
  }
}
