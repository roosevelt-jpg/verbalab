import { Injectable } from '@nestjs/common';
import { KnowledgeCloudService } from '../knowledge-cloud.service';
import { knowledgeProductCatalog } from '../knowledge-products.catalog';
import {
  KnowledgeCatalogPort,
  KnowledgeProductRow,
  KnowledgeProductsBundle,
} from './ports';

@Injectable()
export class NestKnowledgeCatalogAdapter implements KnowledgeCatalogPort {
  constructor(private readonly knowledgeCloud: KnowledgeCloudService) {}

  products(): KnowledgeProductsBundle {
    return this.knowledgeCloud.products();
  }

  listProducts(): KnowledgeProductRow[] {
    return knowledgeProductCatalog();
  }
}
