import { HttpStatus, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ApiException } from '../common/errors/api-exception';

const nodeRequire = createRequire(__filename);
const pdfParse = nodeRequire('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

export type ExtractedDocument = {
  format: 'docx' | 'pdf' | 'txt' | 'markdown' | 'html';
  paragraphs: string[];
};

@Injectable()
export class DocumentCodecService {
  async extract(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedDocument> {
    const lower = filename.toLowerCase();
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lower.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return { format: 'docx', paragraphs: this.splitParagraphs(result.value) };
    }
    if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      return { format: 'pdf', paragraphs: this.splitParagraphs(parsed.text) };
    }
    if (mimeType === 'text/plain' || lower.endsWith('.txt')) {
      return { format: 'txt', paragraphs: this.splitParagraphs(buffer.toString('utf8')) };
    }
    if (
      mimeType === 'text/markdown' ||
      mimeType === 'text/x-markdown' ||
      lower.endsWith('.md') ||
      lower.endsWith('.markdown')
    ) {
      return { format: 'markdown', paragraphs: this.splitParagraphs(buffer.toString('utf8')) };
    }
    if (
      mimeType === 'text/html' ||
      mimeType === 'application/xhtml+xml' ||
      lower.endsWith('.html') ||
      lower.endsWith('.htm')
    ) {
      const raw = buffer.toString('utf8');
      const stripped = raw
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      return { format: 'html', paragraphs: this.splitParagraphs(stripped) };
    }
    throw new ApiException(
      'validation_error',
      'Unsupported file type. Upload DOCX, PDF, TXT, Markdown, or HTML.',
      HttpStatus.BAD_REQUEST,
    );
  }

  /** Pack translated paragraphs. PDF inputs become plain text (no PDF renderer). */
  async pack(
    paragraphs: string[],
    format: ExtractedDocument['format'],
    baseName: string,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            children: paragraphs.map(
              (text) =>
                new Paragraph({
                  children: [new TextRun(text)],
                }),
            ),
          },
        ],
      });
      const buffer = await Packer.toBuffer(doc);
      return {
        buffer,
        filename: `${baseName}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    }

    const text = paragraphs.join('\n\n');
    return {
      buffer: Buffer.from(text, 'utf8'),
      filename: `${baseName}.txt`,
      mimeType: 'text/plain; charset=utf-8',
    };
  }

  chunkParagraphs(paragraphs: string[], maxChars = 1800): string[] {
    const chunks: string[] = [];
    let current = '';
    for (const para of paragraphs) {
      const piece = para.trim();
      if (!piece) continue;
      if (!current) {
        current = piece;
        continue;
      }
      if (current.length + 2 + piece.length <= maxChars) {
        current = `${current}\n\n${piece}`;
      } else {
        chunks.push(current);
        current = piece;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  private splitParagraphs(text: string): string[] {
    return text
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
}
