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
import { OntologyPlatformService } from './ontology-platform.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/ontology')
export class OntologyPlatformController {
  constructor(private readonly ontology: OntologyPlatformService) {}

  @Get('engine')
  engine {
    return this.ontology.engine;
  }

  @Get('domains')
  domains {
    return this.ontology.domains;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.ontology.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.ontology.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('concepts')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('domain') domain?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ontology.listConcepts({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      domain,
      type,
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('concepts/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.ontology.getConcept({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Get('concepts/:id/children')
  @UseGuards(TranslateAuthGuard)
  children(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.ontology.children({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('concepts')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  create(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      description?: string;
      domain?: string;
      type?: string;
      aliases?: string[];
      labels?: Record<string, string>;
      documentId?: string;
    },
  ) {
    return this.ontology.createConcept({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('concepts/:id/labels')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  labels(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { labels?: Record<string, string> },
  ) {
    return this.ontology.setLabels({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      labels: body.labels,
    });
  }

  @Delete('concepts/:id')
  @UseGuards(TranslateAuthGuard)
  remove(@Req req: AuthedReq, @Param('id') id: string) {
    return this.ontology.deleteConcept({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('hierarchies')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  hierarchy(
    @Req req: AuthedReq,
    @Body body: { parentId?: string; childId?: string; label?: string },
  ) {
    return this.ontology.addHierarchy({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('synonyms')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  synonym(
    @Req req: AuthedReq,
    @Body
    body: { conceptId?: string; synonym?: string; synonymConceptId?: string },
  ) {
    return this.ontology.addSynonym({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }
}
