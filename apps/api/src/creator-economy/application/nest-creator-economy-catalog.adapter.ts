import { Injectable } from '@nestjs/common';
import { CreatorEconomyService } from '../creator-economy.service';
import { CreatorEconomyCatalogPort, CreatorEconomyEngineBundle } from './ports';

@Injectable
export class NestCreatorEconomyCatalogAdapter implements CreatorEconomyCatalogPort {
  constructor(private readonly economy: CreatorEconomyService) {}

  engine: CreatorEconomyEngineBundle {
    return this.economy.engine;
  }
}
