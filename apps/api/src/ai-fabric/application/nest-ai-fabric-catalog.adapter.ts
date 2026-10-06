import { Injectable } from '@nestjs/common';
import { AiFabricService } from '../ai-fabric.service';
import { aiFabricBusCatalog } from '../ai-fabric.catalog';
import {
  AiFabricCatalogPort,
  FabricBusRow,
  FabricProductsBundle,
} from './ports';

@Injectable
export class NestAiFabricCatalogAdapter implements AiFabricCatalogPort {
  constructor(private readonly fabric: AiFabricService) {}

  products: FabricProductsBundle {
    return this.fabric.products;
  }

  listBuses: FabricBusRow[] {
    return aiFabricBusCatalog;
  }
}
