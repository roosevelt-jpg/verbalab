import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { TranslateService } from '../translate/translate.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';

const ALLOWED = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

export function ocrMaxBytes: number {
  const raw = Number(process.env.OCR_MAX_BYTES ?? 8 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 8 * 1024 * 1024;
}

@Injectable
export class OcrService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly translate: TranslateService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  assertAllowed(file: { size: number; originalname: string }) {
    if (file.size <= 0) {
      throw new ApiException('validation_error', 'Empty file', HttpStatus.BAD_REQUEST);
    }
    if (file.size > ocrMaxBytes) {
      throw new ApiException(
        'validation_error',
        `File exceeds maximum size of ${ocrMaxBytes} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ext = file.originalname.split('.').pop?.toLowerCase ?? '';
    if (!ALLOWED.has(ext)) {
      throw new ApiException(
        'validation_error',
        'Unsupported file. Upload png, jpeg, webp, or gif.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async extract(input: {
    file: Express.Multer.File;
    languageHint?: string;
    source?: string;
    target?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    this.assertAllowed(input.file);

    const ocr = await this.gateway.ocr({
      buffer: input.file.buffer,
      filename: input.file.originalname,
      mimeType: input.file.mimetype || 'application/octet-stream',
      languageHints: input.languageHint ? [input.languageHint] : undefined,
    });

    await this.usage.recordOcr({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      pages: ocr.pages,
      provider: ocr.provider,
    });

    let translatedText: string | undefined;
    let translateProvider: string | undefined;
    if (input.target) {
      if (!input.source) {
        throw new ApiException(
          'validation_error',
          'source is required when target is set',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!ocr.text) {
        throw new ApiException(
          'validation_error',
          'No text detected to translate',
          HttpStatus.BAD_REQUEST,
        );
      }
      const translated = await this.translate.translate({
        text: ocr.text,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      translatedText = translated.text;
      translateProvider = translated.provider;
    }

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ocr.completed',
      route: 'POST /v1/ocr',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        provider: ocr.provider,
        pages: ocr.pages,
        characters: [...ocr.text].length,
        translated: Boolean(translatedText),
        target: input.target,
      },
    });

    return {
      text: ocr.text,
      pages: ocr.pages,
      provider: ocr.provider,
      characters: [...ocr.text].length,
      translatedText: translatedText ?? null,
      translateProvider: translateProvider ?? null,
      source: input.source ?? null,
      target: input.target ?? null,
    };
  }
}
