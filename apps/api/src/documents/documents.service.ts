import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { TranslateService } from '../translate/translate.service';
import { LocalStorageService } from './local-storage.service';
import { DocumentCodecService } from './document-codec.service';
import {
  DocumentTranslateInput,
  DocumentTranslateResult,
  documentMaxBytes,
} from '../jobs/job.types';
import { AuditService } from '../audit/audit.service';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly codec: DocumentCodecService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  assertAllowedUpload(file: { size: number; mimetype: string; originalname: string }) {
    const max = documentMaxBytes();
    if (file.size > max) {
      throw new ApiException(
        'validation_error',
        `File exceeds maximum size of ${max} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const name = file.originalname.toLowerCase();
    const ok =
      file.mimetype === DOCX_MIME ||
      file.mimetype === PDF_MIME ||
      file.mimetype === 'text/plain' ||
      name.endsWith('.docx') ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt');
    if (!ok) {
      throw new ApiException(
        'validation_error',
        'Unsupported file type. Upload DOCX or PDF.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async storeSource(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    file: Express.Multer.File;
    source: string;
    target: string;
  }) {
    this.assertAllowedUpload(input.file);
    const storageKey = `${input.organizationId}/${randomUUID()}-${sanitizeFilename(input.file.originalname)}`;
    await this.storage.writeBuffer(storageKey, input.file.buffer);

    return this.prisma.document.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        kind: 'source',
        filename: input.file.originalname,
        mimeType: input.file.mimetype || guessMime(input.file.originalname),
        sizeBytes: input.file.size,
        storageKey,
        sourceLang: input.source,
        targetLang: input.target,
      },
    });
  }

  async getOwned(organizationId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Document not found', HttpStatus.NOT_FOUND);
    }
    return doc;
  }

  async readOwnedBuffer(organizationId: string, documentId: string) {
    const doc = await this.getOwned(organizationId, documentId);
    const buffer = await this.storage.readBuffer(doc.storageKey);
    return { doc, buffer };
  }

  openDownloadStream(storageKey: string) {
    return createReadStream(this.storage.absolutePath(storageKey));
  }

  parseDocumentInput(payload: unknown): DocumentTranslateInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid document payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    if (typeof body.documentId !== 'string' || !body.documentId) {
      throw new ApiException('validation_error', 'documentId is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.source !== 'string' || typeof body.target !== 'string') {
      throw new ApiException('validation_error', 'source and target are required', HttpStatus.BAD_REQUEST);
    }
    return { documentId: body.documentId, source: body.source, target: body.target };
  }

  async runDocumentTranslate(job: {
    organizationId: string;
    workspaceId: string;
    apiKeyId: string | null;
    input: Prisma.JsonValue;
  }): Promise<DocumentTranslateResult> {
    const parsed = this.parseDocumentInput(job.input);
    const sourceDoc = await this.getOwned(job.organizationId, parsed.documentId);
    const buffer = await this.storage.readBuffer(sourceDoc.storageKey);
    const extracted = await this.codec.extract(buffer, sourceDoc.mimeType, sourceDoc.filename);
    if (extracted.paragraphs.length === 0) {
      throw new Error('Document contained no extractable text');
    }

    const chunks = this.codec.chunkParagraphs(extracted.paragraphs);
    const translatedChunks: string[] = [];
    let characters = 0;
    let provider = 'unknown';

    for (const chunk of chunks) {
      const translated = await this.translate.translate({
        text: chunk,
        source: parsed.source,
        target: parsed.target,
        organizationId: job.organizationId,
        workspaceId: job.workspaceId,
        apiKeyId: job.apiKeyId ?? undefined,
      });
      translatedChunks.push(translated.text);
      characters += translated.characters;
      provider = translated.provider;
    }

    const baseName = stripExtension(sourceDoc.filename) + `.${parsed.target}`;
    const packed = await this.codec.pack(translatedChunks, extracted.format, baseName);
    const storageKey = `${job.organizationId}/${randomUUID()}-${sanitizeFilename(packed.filename)}`;
    await this.storage.writeBuffer(storageKey, packed.buffer);

    const output = await this.prisma.document.create({
      data: {
        organizationId: job.organizationId,
        workspaceId: job.workspaceId,
        apiKeyId: job.apiKeyId,
        kind: 'output',
        filename: packed.filename,
        mimeType: packed.mimeType,
        sizeBytes: packed.buffer.length,
        storageKey,
        sourceLang: parsed.source,
        targetLang: parsed.target,
      },
    });

    await this.audit.record({
      organizationId: job.organizationId,
      action: 'document.translated',
      route: 'jobs.worker',
      metadata: {
        sourceDocumentId: sourceDoc.id,
        outputDocumentId: output.id,
        characters,
        chunks: chunks.length,
      },
    });

    const preview = translatedChunks.join('\n\n').slice(0, 500);

    return {
      sourceDocumentId: sourceDoc.id,
      outputDocumentId: output.id,
      filename: packed.filename,
      mimeType: packed.mimeType,
      downloadPath: `/v1/documents/${output.id}/content`,
      characters,
      chunks: chunks.length,
      provider,
      preview,
    };
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '') || name;
}

function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.docx')) return DOCX_MIME;
  if (lower.endsWith('.pdf')) return PDF_MIME;
  return 'application/octet-stream';
}
