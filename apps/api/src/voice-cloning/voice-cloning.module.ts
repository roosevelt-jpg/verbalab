import { Module } from '@nestjs/common';
import { VoiceCloningController } from './voice-cloning.controller';
import { VoiceCloningService } from './voice-cloning.service';
import { VoiceClonesModule } from '../voice-clones/voice-clones.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, VoiceClonesModule, IdentityModule],
  controllers: [VoiceCloningController],
  providers: [VoiceCloningService],
  exports: [VoiceCloningService],
})
export class VoiceCloningModule {}
