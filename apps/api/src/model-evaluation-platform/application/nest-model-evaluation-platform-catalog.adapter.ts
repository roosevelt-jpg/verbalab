import { Injectable } from '@nestjs/common';
import { ModelEvaluationPlatformService } from '../model-evaluation-platform.service';
import { modelEvaluationSuites } from '../model-evaluation-platform.catalog';
import {
  ModelEvaluationPlatformCatalogPort,
  MepEngineBundle,
  MepSuiteRow,
} from './ports';

@Injectable()
export class NestModelEvaluationPlatformCatalogAdapter
  implements ModelEvaluationPlatformCatalogPort
{
  constructor(private readonly platform: ModelEvaluationPlatformService) {}

  engine(): MepEngineBundle {
    return this.platform.engine();
  }

  listSuites(): MepSuiteRow[] {
    return modelEvaluationSuites();
  }
}
