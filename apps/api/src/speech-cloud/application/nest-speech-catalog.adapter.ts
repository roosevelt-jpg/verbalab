import { Injectable } from '@nestjs/common';
import { SpeechCloudService } from '../speech-cloud.service';
import { speechProductCatalog } from '../speech-products.catalog';
import {
  SpeechCatalogPort,
  SpeechProductRow,
  SpeechProductsBundle,
} from './ports';

@Injectable()
export class NestSpeechCatalogAdapter implements SpeechCatalogPort {
  constructor(private readonly speechCloud: SpeechCloudService) {}

  products(): SpeechProductsBundle {
    return this.speechCloud.products();
  }

  listProducts(): SpeechProductRow[] {
    return speechProductCatalog();
  }
}
