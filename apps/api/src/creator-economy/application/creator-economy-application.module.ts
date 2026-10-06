import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreatorEconomyModule } from '../creator-economy.module';
import { CREATOR_ECONOMY_CATALOG_PORT } from './ports';
import { NestCreatorEconomyCatalogAdapter } from './nest-creator-economy-catalog.adapter';
import { CREATOR_ECONOMY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CreatorEconomyModule],
  providers: [
    NestCreatorEconomyCatalogAdapter,
    {
      provide: CREATOR_ECONOMY_CATALOG_PORT,
      useExisting: NestCreatorEconomyCatalogAdapter,
    },
    ...CREATOR_ECONOMY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CreatorEconomyApplicationModule {}
