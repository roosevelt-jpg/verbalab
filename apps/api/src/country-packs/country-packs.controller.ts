import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountryPacksService } from './country-packs.service';

@Controller('v1/country-packs')
export class CountryPacksController {
  constructor(private readonly countryPacks: CountryPacksService) {}

  @Get('engine')
  engine() {
    return this.countryPacks.engine();
  }

  @Get()
  list(@Query('region') region?: string) {
    return this.countryPacks.list(region?.trim() || undefined);
  }

  @Get(':code')
  get(
    @Param('code') code: string,
    @Query('includeLocales') includeLocales?: string,
  ) {
    const include =
      includeLocales === '1' ||
      includeLocales === 'true' ||
      includeLocales === 'yes';
    return this.countryPacks.get(code, { includeLocales: include });
  }
}
