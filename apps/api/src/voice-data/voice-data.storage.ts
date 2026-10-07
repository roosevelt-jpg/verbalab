import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

/**
 * Voice-data audio in S3-compatible object storage (Fly Tigris sets BUCKET_NAME + AWS_*).
 * Without a bucket the service keeps audio in Postgres — fine for a pilot, not for full corpora.
 */
@Injectable()
export class VoiceDataStorage {
  private readonly bucket = (process.env.VOICE_DATA_BUCKET ?? process.env.BUCKET_NAME ?? '').trim();
  private client: S3Client | null = null;

  enabled(): boolean {
    return Boolean(this.bucket);
  }

  private s3(): S3Client {
    this.client ??= new S3Client({
      region: process.env.AWS_REGION ?? 'auto',
      endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined,
      forcePathStyle: false,
    });
    return this.client;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.s3().send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const out = await this.s3().send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await out.Body?.transformToByteArray();
    return Buffer.from(bytes ?? []);
  }

  async remove(key: string): Promise<void> {
    await this.s3().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
