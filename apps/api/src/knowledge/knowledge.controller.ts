import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { KnowledgeService } from './knowledge.service';
import { documentMaxBytes } from '../jobs/job.types';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get('documents')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
    @Query('collection') collection?: string,
    @Query('tag') tag?: string,
    @Query('contentKind') contentKind?: string,
  ) {
    return this.knowledge.list(req.translateAuth.organizationId, req.translateAuth.workspaceId, {
      collection,
      tag,
      contentKind,
    });
  }

  @Get('documents/:id')
  @UseGuards(TranslateAuthGuard)
  get(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
    @Param('id') id: string,
  ) {
    return this.knowledge.get(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      id,
    );
  }

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TranslateAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: documentMaxBytes },
    }),
  )
  upload(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
      body: { collection?: string; tags?: string; contentKind?: string };
    },
    @UploadedFile file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    return this.knowledge.upload({
      file,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      collection: req.body?.collection,
      tags: req.body?.tags,
      contentKind: req.body?.contentKind,
    });
  }

  @Delete('documents/:id')
  @UseGuards(TranslateAuthGuard)
  remove(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
    },
    @Param('id') id: string,
  ) {
    return this.knowledge.remove(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
      id,
    );
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  query(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { question?: string; k?: number },
  ) {
    return this.knowledge.query({
      question: body.question ?? '',
      k: body.k,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
