import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetAiKernelProductsBundleQuery,
  ListAiKernelRuntimesQuery,
} from './messages';
import {
  AI_KERNEL_CATALOG_PORT,
  AiKernelCatalogPort,
  KernelProductsBundle,
  KernelRuntimeRow,
} from './ports';

@QueryHandler(ListAiKernelRuntimesQuery)
export class ListAiKernelRuntimesHandler
  implements IQueryHandler<ListAiKernelRuntimesQuery>
{
  constructor(
    @Inject(AI_KERNEL_CATALOG_PORT) private readonly catalog: AiKernelCatalogPort,
  ) {}

  execute(): Promise<KernelRuntimeRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

@QueryHandler(GetAiKernelProductsBundleQuery)
export class GetAiKernelProductsBundleHandler
  implements IQueryHandler<GetAiKernelProductsBundleQuery>
{
  constructor(
    @Inject(AI_KERNEL_CATALOG_PORT) private readonly catalog: AiKernelCatalogPort,
  ) {}

  execute(): Promise<KernelProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const AI_KERNEL_HANDLERS = [
  ListAiKernelRuntimesHandler,
  GetAiKernelProductsBundleHandler,
];
