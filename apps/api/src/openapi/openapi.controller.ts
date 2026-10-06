import { Controller, Get, Header } from '@nestjs/common';
import { openApiDocument } from './openapi.document';

@Controller()
export class OpenApiController {
  @Get('v1/openapi.json')
  @Header('Content-Type', 'application/json')
  getOpenApi() {
    return openApiDocument;
  }
}
