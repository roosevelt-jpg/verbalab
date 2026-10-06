import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetModelRegistryEngineQuery,
  ListModelRegistryCapabilitiesQuery,
} from './messages';
import {
  MODEL_REGISTRY_CATALOG_PORT,
  ModelRegistryCatalogPort,
  MrCapabilityRow,
  MrEngineBundle,
} from './ports';

@QueryHandler(ListModelRegistryCapabilitiesQuery)
export class ListModelRegistryCapabilitiesHandler
  implements IQueryHandler<ListModelRegistryCapabilitiesQuery>
{
  constructor(
    @Inject(MODEL_REGISTRY_CATALOG_PORT)
    private readonly catalog: ModelRegistryCatalogPort,
  ) {}

  execute: Promise<MrCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(GetModelRegistryEngineQuery)
export class GetModelRegistryEngineHandler
  implements IQueryHandler<GetModelRegistryEngineQuery>
{
  constructor(
    @Inject(MODEL_REGISTRY_CATALOG_PORT)
    private readonly catalog: ModelRegistryCatalogPort,
  ) {}

  execute: Promise<MrEngineBundle> {
    return this.catalog.engine;
  }
}

export const MODEL_REGISTRY_HANDLERS = [
  ListModelRegistryCapabilitiesHandler,
  GetModelRegistryEngineHandler,
];
