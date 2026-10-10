import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  /** True after a successful `$connect` (false when DATABASE_URL is unset). */
  isReady(): boolean {
    return this.connected;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL?.trim()) {
      this.logger.warn(
        'DATABASE_URL unset — skipping Prisma connect (Fly first boot). Set secrets before using DB routes.',
      );
      return;
    }
    await this.$connect();
    this.connected = true;
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
    }
  }
}
