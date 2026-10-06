import { Injectable } from '@nestjs/common';
import { VoiceCloudService } from '../voice-cloud.service';
import { voiceProductCatalog } from '../voice-products.catalog';
import {
  VoiceCatalogPort,
  VoiceProductRow,
  VoiceProductsBundle,
} from './ports';

@Injectable
export class NestVoiceCatalogAdapter implements VoiceCatalogPort {
  constructor(private readonly voiceCloud: VoiceCloudService) {}

  products: VoiceProductsBundle {
    return this.voiceCloud.products;
  }

  listProducts: VoiceProductRow[] {
    return voiceProductCatalog;
  }
}
