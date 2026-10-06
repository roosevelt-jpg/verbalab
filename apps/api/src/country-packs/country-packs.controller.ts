import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountryPacksService } from './country-packs.service';

/** `/v1/countries` is a stable alias for Studio/docs that say "countries". */
@Controller(['v1/country-packs', 'v1/countries'])
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

/** Alias surface: GET /v1/countries → full ISO country packs / picker list. */
@Controller('v1/countries')
export class CountriesAliasController {
  constructor(private readonly countryPacks: CountryPacksService) {}

  @Get('engine')
  engine() {
    return this.countryPacks.engine();
  }

  /** Default: full country packs. ?picker=1 returns lightweight picker rows. */
  @Get()
  list(
    @Query('region') region?: string,
    @Query('picker') picker?: string,
  ) {
    const asPicker = picker === '1' || picker === 'true' || picker === 'yes';
    if (asPicker) {
      return this.countryPacks.pickerList(region?.trim() || undefined);
    }
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
