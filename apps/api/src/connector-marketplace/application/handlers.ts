import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetConnectorMarketplaceEngineQuery } from './messages';
import {
  CONNECTOR_MARKETPLACE_CATALOG_PORT,
  ConnectorMarketplaceCatalogPort,
  ConnectorMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetConnectorMarketplaceEngineQuery)
export class GetConnectorMarketplaceEngineHandler
  implements IQueryHandler<GetConnectorMarketplaceEngineQuery>
{
  constructor(
    @Inject(CONNECTOR_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: ConnectorMarketplaceCatalogPort,
  ) {}

  execute(): Promise<ConnectorMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const CONNECTOR_MARKETPLACE_HANDLERS = [GetConnectorMarketplaceEngineHandler];
