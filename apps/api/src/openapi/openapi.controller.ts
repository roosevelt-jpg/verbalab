import { Controller, Get, Header, Res, type Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import type { Response } from 'express';
import { buildOpenApiDocument, type OpenApiDocument } from './openapi.builder';
import { routesFromControllers } from './openapi.routes';

function renderScalarHtml(specUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lugemi API Reference</title>
    <link rel="icon" type="image/svg+xml" href="https://lugemi.com/favicon.ico" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${specUrl}"
      data-configuration='{"theme":"purple","layout":"modern","showSidebar":true,"metaData":{"title":"Lugemi API Reference"}}'>
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

function renderSwaggerHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lugemi API · Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <link rel="icon" type="image/svg+xml" href="https://lugemi.com/favicon.ico" />
    <style>
      html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
      .topbar { display: none !important; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: "${specUrl}",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
</html>`;
}

@Controller()
export class OpenApiController {
  private document: OpenApiDocument | null = null;

  constructor(private readonly discovery: DiscoveryService) {}

  public ensureDocument(): OpenApiDocument {
    if (!this.document) {
      const controllers = this.discovery
        .getControllers()
        .map((wrapper) => wrapper.metatype as Type<unknown> | null)
        .filter((metatype): metatype is Type<unknown> => typeof metatype === 'function');
      this.document = buildOpenApiDocument(routesFromControllers(controllers));
    }
    return this.document;
  }

  public getOpenApiDocument(): OpenApiDocument {
    return this.ensureDocument();
  }

  @Get('v1/openapi.json')
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  getOpenApi(@Res() res: Response): void {
    const doc = this.ensureDocument();
    res.type('application/json').send(JSON.stringify(doc, null, 2));
  }

  @Get(['docs', 'v1/docs'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  getDocs(@Res() res: Response): void {
    res.type('html').send(renderScalarHtml('/v1/openapi.json'));
  }

  @Get(['swagger', 'v1/swagger'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  getSwagger(@Res() res: Response): void {
    res.type('html').send(renderSwaggerHtml('/v1/openapi.json'));
  }
}
