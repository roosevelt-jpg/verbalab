import { Injectable } from '@nestjs/common';
import { PromptMarketplaceService } from '../prompt-marketplace.service';
import {
  PromptMarketplaceCatalogPort,
  PromptMarketplaceEngineBundle,
} from './ports';

@Injectable
export class NestPromptMarketplaceCatalogAdapter implements PromptMarketplaceCatalogPort {
  constructor(private readonly marketplace: PromptMarketplaceService) {}

  engine: PromptMarketplaceEngineBundle {
    return this.marketplace.engine;
  }
}
