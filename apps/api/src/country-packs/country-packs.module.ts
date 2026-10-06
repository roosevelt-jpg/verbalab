import { Module } from '@nestjs/common';
import { CountryPacksController } from './country-packs.controller';
import { CountryPacksService } from './country-packs.service';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [LocalesModule],
  controllers: [CountryPacksController],
  providers: [CountryPacksService],
  exports: [CountryPacksService],
})
export class CountryPacksModule {}
