import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { LocalesService } from './locales.service';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/locales')
export class LocalesController {
  constructor(private readonly locales: LocalesService) {}

  @Get()
  async list() {
    const data = await this.locales.list();
    return { data };
  }

  @Post('format')
  @HttpCode(HttpStatus.OK)
  format(
    @Body()
    body: {
      code?: string;
      date?: string;
      number?: number;
      currencyValue?: number;
      timeZone?: string;
    },
  ) {
    if (!body.code) {
      throw new ApiException('validation_error', 'code is required', HttpStatus.BAD_REQUEST);
    }
    return this.locales.format({
      code: body.code,
      date: body.date,
      number: body.number,
      currencyValue: body.currencyValue,
      timeZone: body.timeZone,
    });
  }

  @Get(':code/examples')
  examples(@Param('code') code: string) {
    return this.locales.formatExamples(code);
  }

  @Get(':code/layout')
  layout(@Param('code') code: string) {
    return this.locales.layout(code);
  }

  @Get(':code')
  get(@Param('code') code: string) {
    return this.locales.get(code);
  }
}
