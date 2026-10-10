import { Controller, Get, Query } from '@nestjs/common';
import { portfolioCatalog } from './portfolio.catalog';
import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
  PORTFOLIO_COUNTRIES_COVERED,
  PORTFOLIO_COUNTRY_PACK_TOTAL,
  portfolioCountrySummaries,
} from './portfolio.corridors';

@Controller('v1/portfolio')
export class PortfolioController {
  @Get('engine')
  engine() {
    return portfolioCatalog();
  }

  @Get('corridors')
  corridors(
    @Query('q') q?: string,
    @Query('country') country?: string,
    @Query('region') region?: string,
  ) {
    const needle = q?.trim().toLowerCase();
    const countryNeedle = country?.trim().toLowerCase();
    const regionNeedle = region?.trim().toLowerCase();

    let corridors = PORTFOLIO_CORRIDORS;
    if (countryNeedle) {
      corridors = corridors.filter((c) => {
        if (c.countryCode.toLowerCase() === countryNeedle) return true;
        // Avoid 2-letter ISO codes matching substrings (e.g. ng ⊂ Congo/Angola).
        if (countryNeedle.length <= 2) return false;
        return c.countryName.toLowerCase().includes(countryNeedle);
      });
    }
    if (regionNeedle) {
      corridors = corridors.filter((c) => c.region.toLowerCase().includes(regionNeedle));
    }
    if (needle) {
      corridors = corridors.filter(
        (c) =>
          c.id.includes(needle) ||
          c.label.toLowerCase().includes(needle) ||
          c.languageCode.includes(needle) ||
          c.varietyId.toLowerCase().includes(needle) ||
          c.countryCode.toLowerCase().includes(needle) ||
          c.countryName.toLowerCase().includes(needle) ||
          c.region.toLowerCase().includes(needle) ||
          (c.nameNative?.toLowerCase().includes(needle) ?? false),
      );
    }

    const countries = portfolioCountrySummaries().filter((row) => {
      if (countryNeedle) {
        if (row.code.toLowerCase() === countryNeedle) return true;
        if (countryNeedle.length <= 2) return false;
        return row.nameEn.toLowerCase().includes(countryNeedle);
      }
      if (regionNeedle) return row.region.toLowerCase().includes(regionNeedle);
      if (needle) {
        return (
          row.code.toLowerCase().includes(needle) ||
          row.nameEn.toLowerCase().includes(needle) ||
          row.region.toLowerCase().includes(needle)
        );
      }
      return true;
    });

    return {
      corridors,
      count: corridors.length,
      total: PORTFOLIO_CORRIDOR_COUNT,
      countries,
      countries_covered: PORTFOLIO_COUNTRIES_COVERED,
      country_pack_total: PORTFOLIO_COUNTRY_PACK_TOTAL,
      note: `Full country-pack catalog: ${PORTFOLIO_CORRIDOR_COUNT} language↔English corridors across ${PORTFOLIO_COUNTRIES_COVERED} of ${PORTFOLIO_COUNTRY_PACK_TOTAL} countries. Filter with ?country= or ?q=. Evaluation depth varies — only design-partner varieties are marked evaluated; catalog membership is not a claim that every corridor is evaluated.`,
    };
  }
}
