import { Controller, Get, Query } from '@nestjs/common';
import { AfricanKnowledgeGraphService } from './african-knowledge-graph.service';

@Controller('v1/african-knowledge-graph')
export class AfricanKnowledgeGraphController {
  constructor(private readonly graph: AfricanKnowledgeGraphService) {}

  @Get('engine')
  engine {
    return this.graph.engine;
  }

  @Get('products')
  products {
    return this.graph.engine;
  }

  @Get('monitoring')
  monitoring {
    return this.graph.monitoring;
  }

  @Get('nodes')
  nodes(@Query('kind') kind?: string) {
    return this.graph.nodes(kind);
  }

  @Get('edges')
  edges(@Query('rel') rel?: string) {
    return this.graph.edges(rel);
  }

  @Get('query')
  query(@Query('kind') kind?: string, @Query('q') q?: string) {
    return this.graph.query({ kind, q });
  }
}
