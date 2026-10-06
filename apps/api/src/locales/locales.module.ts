import { Module } from '@nestjs/common';
import { LocalesController } from './locales.controller';
import { LocalesService } from './locales.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LocalesController],
  providers: [LocalesService],
  exports: [LocalesService],
})
export class LocalesModule {}
