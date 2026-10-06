import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { DatasetsService } from './datasets.service';
import { datasetMaxBytes, DATASET_LICENSE_TAGS } from './datasets.types';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/datasets')
@UseGuards(ClerkAuthGuard)
export class DatasetsController {
  constructor(private readonly datasets: DatasetsService) {}

  @Get('licenses')
  licenses {
    return { data: DATASET_LICENSE_TAGS };
  }

  @Get
  list(@CurrentSession session: SessionContext) {
    return this.datasets.list(session.organizationId, session.workspaceId);
  }

  @Get(':id')
  get(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.datasets.get(session.organizationId, id);
  }

  @Post
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: datasetMaxBytes },
    }),
  )
  create(
    @CurrentSession session: SessionContext,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body
    body: {
      title?: string;
      licenseTag?: string;
      consentNotes?: string;
      containsPii?: string;
      sourceLang?: string;
      targetLang?: string;
      partnerOrgName?: string;
      note?: string;
    },
    @Req req: Request,
  ) {
    return this.datasets.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      title: body.title ?? '',
      licenseTag: body.licenseTag ?? '',
      consentNotes: body.consentNotes ?? '',
      containsPii: body.containsPii,
      sourceLang: body.sourceLang,
      targetLang: body.targetLang,
      partnerOrgName: body.partnerOrgName,
      note: body.note,
      file: file as Express.Multer.File,
      ip: req.ip,
    });
  }

  @Patch(':id')
  update(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Body
    body: {
      title?: string;
      licenseTag?: string;
      consentNotes?: string;
      containsPii?: boolean;
      sourceLang?: string | null;
      targetLang?: string | null;
      partnerOrgName?: string | null;
      status?: string;
    },
    @Req req: Request,
  ) {
    return this.datasets.updateMetadata({
      organizationId: session.organizationId,
      assetId: id,
      role: session.role,
      userId: session.userId,
      ...body,
      ip: req.ip,
    });
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage,
      limits: { fileSize: datasetMaxBytes },
    }),
  )
  addVersion(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @UploadedFile file: Express.Multer.File | undefined,
    @Body body: { note?: string },
    @Req req: Request,
  ) {
    return this.datasets.addVersion({
      organizationId: session.organizationId,
      assetId: id,
      role: session.role,
      userId: session.userId,
      note: body.note,
      file: file as Express.Multer.File,
      ip: req.ip,
    });
  }

  @Get(':id/versions/:version/content')
  @Header('Cache-Control', 'no-store')
  async content(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Param('version') version: string,
    @Res res: Response,
  ) {
    const file = await this.datasets.readContent({
      organizationId: session.organizationId,
      assetId: id,
      version: Number(version),
    });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    );
    res.send(file.buffer);
  }

  @Delete(':id')
  archive(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Req req: Request,
  ) {
    return this.datasets.archive({
      organizationId: session.organizationId,
      assetId: id,
      role: session.role,
      userId: session.userId,
      ip: req.ip,
    });
  }
}
