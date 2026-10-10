import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBenchmarkPlatformEngineQuery, ListBenchmarkPlatformProductsQuery } from './messages';
import {
  BENCHMARK_PLATFORM_CATALOG_PORT,
  BenchmarkPlatformCatalogPort,
  BenchmarkPlatformEngineBundle,
  BenchmarkPlatformProductRow,
} from './ports';

@QueryHandler(GetBenchmarkPlatformEngineQuery)
export class GetBenchmarkPlatformEngineHandler
  implements IQueryHandler<GetBenchmarkPlatformEngineQuery>
{
  constructor(
    @Inject(BENCHMARK_PLATFORM_CATALOG_PORT)
    private readonly catalog: BenchmarkPlatformCatalogPort,
  ) {}

  execute(): Promise<BenchmarkPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListBenchmarkPlatformProductsQuery)
export class ListBenchmarkPlatformProductsHandler
  implements IQueryHandler<ListBenchmarkPlatformProductsQuery>
{
  constructor(
    @Inject(BENCHMARK_PLATFORM_CATALOG_PORT)
    private readonly catalog: BenchmarkPlatformCatalogPort,
  ) {}

  execute(): Promise<BenchmarkPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const BENCHMARK_PLATFORM_HANDLERS = [GetBenchmarkPlatformEngineHandler, ListBenchmarkPlatformProductsHandler];
