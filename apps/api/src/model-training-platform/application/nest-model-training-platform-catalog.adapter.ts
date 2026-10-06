import { Injectable } from '@nestjs/common';
import { ModelTrainingPlatformService } from '../model-training-platform.service';
import { modelTrainingMethods } from '../model-training-platform.catalog';
import {
  ModelTrainingPlatformCatalogPort,
  MtpEngineBundle,
  MtpMethodRow,
} from './ports';

@Injectable
export class NestModelTrainingPlatformCatalogAdapter
  implements ModelTrainingPlatformCatalogPort
{
  constructor(private readonly platform: ModelTrainingPlatformService) {}

  engine: MtpEngineBundle {
    return this.platform.engine;
  }

  listMethods: MtpMethodRow[] {
    return modelTrainingMethods;
  }
}
