import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/knowledge-graph')
export class KnowledgeGraphController {
  constructor(private readonly knowledgeGraph: KnowledgeGraphService) {}

  @Get('engine')
  engine {
    return this.knowledgeGraph.engine;
  }

  @Get('domains')
  domains {
    return this.knowledgeGraph.domains;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.knowledgeGraph.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.knowledgeGraph.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('entities')
  @UseGuards(TranslateAuthGuard)
  listEntities(
    @Req req: AuthedReq,
    @Query('type') type?: string,
    @Query('domain') domain?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeGraph.listEntities({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      type,
      domain,
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('entities/:id')
  @UseGuards(TranslateAuthGuard)
  getEntity(@Req req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeGraph.getEntity({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Get('entities/:id/neighborhood')
  @UseGuards(TranslateAuthGuard)
  neighborhood(@Req req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeGraph.neighborhood({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      entityId: id,
    });
  }

  @Post('entities')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  createEntity(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      type?: string;
      description?: string;
      documentId?: string;
      domain?: string;
      aliases?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.knowledgeGraph.createEntity({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      name: body.name ?? '',
      type: body.type,
      description: body.description,
      documentId: body.documentId,
      domain: body.domain,
      aliases: body.aliases,
      metadata: body.metadata,
    });
  }

  @Delete('entities/:id')
  @UseGuards(TranslateAuthGuard)
  deleteEntity(@Req req: AuthedReq, @Param('id') id: string) {
    return this.knowledgeGraph.deleteEntity({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Get('relationships')
  @UseGuards(TranslateAuthGuard)
  listRelationships(
    @Req req: AuthedReq,
    @Query('entityId') entityId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeGraph.listRelationships({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      entityId,
      type,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('relationships')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  createRelationship(
    @Req req: AuthedReq,
    @Body
    body: {
      fromEntityId?: string;
      toEntityId?: string;
      type?: string;
      label?: string;
      weight?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.knowledgeGraph.createRelationship({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      fromEntityId: body.fromEntityId ?? '',
      toEntityId: body.toEntityId ?? '',
      type: body.type,
      label: body.label,
      weight: body.weight,
      metadata: body.metadata,
    });
  }
}
