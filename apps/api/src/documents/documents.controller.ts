import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JobsService } from '../jobs/jobs.service';
import { ApiKeyGuard, ApiKeyContext } from '../common/guards/api-key.guard';
import { CurrentApiKey } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { documentMaxBytes } from '../jobs/job.types';

@Controller('v1/documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly jobs: JobsService,
  ) {}

  @Post('translate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: documentMaxBytes() },
    }),
  )
  async translate(
    @CurrentApiKey() auth: ApiKeyContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { source?: string; target?: string; webhookUrl?: string },
  ) {
    if (!file) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.source || !body.target) {
      throw new ApiException('validation_error', 'source and target are required', HttpStatus.BAD_REQUEST);
    }

    const doc = await this.documents.storeSource({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      file,
      source: body.source,
      target: body.target,
    });

    return this.jobs.create({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      type: 'document_translate',
      payload: {
        documentId: doc.id,
        source: body.source,
        target: body.target,
      },
      webhookUrl: body.webhookUrl,
      route: 'POST /v1/documents/translate',
    });
  }

  @Get(':id/content')
  @UseGuards(ApiKeyGuard)
  async content(
    @CurrentApiKey() auth: ApiKeyContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const doc = await this.documents.getOwned(auth.organizationId, id);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename.replace(/"/g, '')}"`);
    res.setHeader('Content-Length', String(doc.sizeBytes));
    this.documents.openDownloadStream(doc.storageKey).pipe(res);
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', 'no-store')
  async meta(@CurrentApiKey() auth: ApiKeyContext, @Param('id') id: string) {
    const doc = await this.documents.getOwned(auth.organizationId, id);
    return {
      id: doc.id,
      kind: doc.kind,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      sourceLang: doc.sourceLang,
      targetLang: doc.targetLang,
      downloadPath: `/v1/documents/${doc.id}/content`,
      createdAt: doc.createdAt,
    };
  }
}
