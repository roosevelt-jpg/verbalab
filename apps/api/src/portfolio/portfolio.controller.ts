import { Controller, Get } from '@nestjs/common';
import { portfolioCatalog } from './portfolio.catalog';
import { PORTFOLIO_PILOT_CORRIDORS } from './portfolio.meta';

@Controller('v1/portfolio')
export class PortfolioController {
  @Get('engine')
  engine() {
    return portfolioCatalog();
  }

  @Get('corridors')
  corridors() {
    return {
      corridors: PORTFOLIO_PILOT_CORRIDORS,
      note: 'Pilot corridors for Verified Interpreter. Evaluated varieties are listed explicitly; unknown variety is valid.',
    };
  }
}
