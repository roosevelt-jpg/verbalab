import { Controller, Get, Query } from '@nestjs/common';
import { portfolioCatalog } from './portfolio.catalog';
import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
} from './portfolio.meta';

@Controller('v1/portfolio')
export class PortfolioController {
  @Get('engine')
  engine() {
    return portfolioCatalog();
  }

  @Get('corridors')
  corridors(@Query('q') q?: string) {
    const needle = q?.trim().toLowerCase();
    const corridors = needle
      ? PORTFOLIO_CORRIDORS.filter(
          (c) =>
            c.id.includes(needle) ||
            c.label.toLowerCase().includes(needle) ||
            c.languageCode.includes(needle) ||
            c.varietyId.toLowerCase().includes(needle) ||
            (c.nameNative?.toLowerCase().includes(needle) ?? false),
        )
      : PORTFOLIO_CORRIDORS;
    return {
      corridors,
      count: corridors.length,
      total: PORTFOLIO_CORRIDOR_COUNT,
      note: `Full registry corridors (${PORTFOLIO_CORRIDOR_COUNT} language↔English). Strategic varieties are marked evaluated; catalog membership enables selection — not a claim of production on-device quality.`,
    };
  }
}
