import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSecretsCertificatePlatformEngineQuery, ListSecretsCertificatePlatformProductsQuery } from './messages';
import {
  SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT,
  SecretsCertificatePlatformCatalogPort,
  SecretsCertificatePlatformEngineBundle,
  SecretsCertificatePlatformProductRow,
} from './ports';

@QueryHandler(GetSecretsCertificatePlatformEngineQuery)
export class GetSecretsCertificatePlatformEngineHandler
  implements IQueryHandler<GetSecretsCertificatePlatformEngineQuery>
{
  constructor(
    @Inject(SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT)
    private readonly catalog: SecretsCertificatePlatformCatalogPort,
  ) {}

  execute: Promise<SecretsCertificatePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListSecretsCertificatePlatformProductsQuery)
export class ListSecretsCertificatePlatformProductsHandler
  implements IQueryHandler<ListSecretsCertificatePlatformProductsQuery>
{
  constructor(
    @Inject(SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT)
    private readonly catalog: SecretsCertificatePlatformCatalogPort,
  ) {}

  execute: Promise<SecretsCertificatePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const SECRETS_CERTIFICATE_PLATFORM_HANDLERS = [GetSecretsCertificatePlatformEngineHandler, ListSecretsCertificatePlatformProductsHandler];
