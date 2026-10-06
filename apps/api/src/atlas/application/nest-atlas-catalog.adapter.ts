import { Injectable } from '@nestjs/common';
import { AtlasService } from '../atlas.service';
import { atlasCapabilities } from '../atlas.catalog';
import {
  AtlasCatalogPort,
  AtlasCapabilityRow,
  AtlasEngineBundle,
} from './ports';

@Injectable()
export class NestAtlasCatalogAdapter implements AtlasCatalogPort {
  constructor(private readonly atlas: AtlasService) {}

  engine(): AtlasEngineBundle {
    return this.atlas.engine();
  }

  listCapabilities(): AtlasCapabilityRow[] {
    return atlasCapabilities();
  }
}
