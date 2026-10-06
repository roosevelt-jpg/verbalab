import { Injectable } from '@nestjs/common';
import { AiKernelService } from '../ai-kernel.service';
import { aiKernelRuntimeCatalog } from '../ai-kernel.catalog';
import {
  AiKernelCatalogPort,
  KernelProductsBundle,
  KernelRuntimeRow,
} from './ports';

@Injectable
export class NestAiKernelCatalogAdapter implements AiKernelCatalogPort {
  constructor(private readonly kernel: AiKernelService) {}

  products: KernelProductsBundle {
    return this.kernel.products;
  }

  listProducts: KernelRuntimeRow[] {
    return aiKernelRuntimeCatalog;
  }
}
