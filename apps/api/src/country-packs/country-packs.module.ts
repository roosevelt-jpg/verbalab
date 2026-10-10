import { Module } from '@nestjs/common';
import {
  CountriesAliasController,
  CountryPacksController,
} from './country-packs.controller';
import { CountryPacksService } from './country-packs.service';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [LocalesModule],
  controllers: [CountryPacksController, CountriesAliasController],
  providers: [CountryPacksService],
  exports: [CountryPacksService],
})
export class CountryPacksModule {}
