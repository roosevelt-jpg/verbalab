import { Controller, Get, Header, type Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { buildOpenApiDocument, type OpenApiDocument } from './openapi.builder';
import { routesFromControllers } from './openapi.routes';

@Controller()
export class OpenApiController {
  private document: OpenApiDocument | null = null;

  constructor(private readonly discovery: DiscoveryService) {}

  @Get('v1/openapi.json')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=300')
  getOpenApi(): OpenApiDocument {
    if (!this.document) {
      const controllers = this.discovery
        .getControllers()
        .map((wrapper) => wrapper.metatype as Type<unknown> | null)
        .filter((metatype): metatype is Type<unknown> => typeof metatype === 'function');
      this.document = buildOpenApiDocument(routesFromControllers(controllers));
    }
    return this.document;
  }
}
