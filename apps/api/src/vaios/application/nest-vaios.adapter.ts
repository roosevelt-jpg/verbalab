import { Injectable } from '@nestjs/common';
import { VaiosService } from '../vaios.service';
import {
  VaiosCatalogPort,
  VaiosEngineBundle,
  VaiosProductRow,
} from './ports';

@Injectable
export class NestVaiosCatalogAdapter implements VaiosCatalogPort {
  constructor(private readonly service: VaiosService) {}

  engine: VaiosEngineBundle {
    return this.service.products;
  }

  listProducts: VaiosProductRow[] {
    return this.service.products.products;
  }
}
