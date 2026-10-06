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
import { TaxonomyPlatformService } from './taxonomy-platform.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/taxonomy')
export class TaxonomyPlatformController {
  constructor(private readonly taxonomy: TaxonomyPlatformService) {}

  @Get('engine')
  engine {
    return this.taxonomy.engine;
  }

  @Get('content-types')
  contentTypes {
    return this.taxonomy.contentTypes;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.taxonomy.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.taxonomy.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('trees')
  @UseGuards(TranslateAuthGuard)
  trees(@Req req: AuthedReq, @Query('kind') kind?: string) {
    return this.taxonomy.trees({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      kind,
    });
  }

  @Get('terms')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req req: AuthedReq,
    @Query('kind') kind?: string,
    @Query('parentId') parentId?: string,
    @Query('root') root?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.taxonomy.listTerms({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      kind,
      parentId: root === '1' || root === 'true' ? null : parentId,
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('terms/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.taxonomy.getTerm({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Get('terms/:id/children')
  @UseGuards(TranslateAuthGuard)
  children(@Req req: AuthedReq, @Param('id') id: string) {
    return this.taxonomy.children({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('terms')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  create(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      slug?: string;
      kind?: string;
      parentId?: string | null;
      description?: string;
      sortOrder?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.taxonomy.createTerm({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Delete('terms/:id')
  @UseGuards(TranslateAuthGuard)
  remove(@Req req: AuthedReq, @Param('id') id: string) {
    return this.taxonomy.deleteTerm({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  assign(
    @Req req: AuthedReq,
    @Body body: { termId?: string; documentId?: string; syncDocument?: boolean },
  ) {
    return this.taxonomy.assign({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  classify(
    @Req req: AuthedReq,
    @Body body: { documentId?: string; apply?: boolean },
  ) {
    return this.taxonomy.classify({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }
}
