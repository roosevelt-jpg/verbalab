import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCompliancePlatformEngineQuery, ListCompliancePlatformProductsQuery } from './messages';
import {
  COMPLIANCE_PLATFORM_CATALOG_PORT,
  CompliancePlatformCatalogPort,
  CompliancePlatformEngineBundle,
  CompliancePlatformProductRow,
} from './ports';

@QueryHandler(GetCompliancePlatformEngineQuery)
export class GetCompliancePlatformEngineHandler
  implements IQueryHandler<GetCompliancePlatformEngineQuery>
{
  constructor(
    @Inject(COMPLIANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: CompliancePlatformCatalogPort,
  ) {}

  execute: Promise<CompliancePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListCompliancePlatformProductsQuery)
export class ListCompliancePlatformProductsHandler
  implements IQueryHandler<ListCompliancePlatformProductsQuery>
{
  constructor(
    @Inject(COMPLIANCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: CompliancePlatformCatalogPort,
  ) {}

  execute: Promise<CompliancePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const COMPLIANCE_PLATFORM_HANDLERS = [GetCompliancePlatformEngineHandler, ListCompliancePlatformProductsHandler];
