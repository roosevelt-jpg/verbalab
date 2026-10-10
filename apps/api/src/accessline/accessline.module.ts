import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { AccessLineAdapters } from './accessline.adapters';
import { AccessLineController } from './accessline.controller';
import { AccessLineService } from './accessline.service';
import { AccessLineTwilioController } from './accessline.twilio.controller';

@Module({
  imports: [ApiKeysModule, IdentityModule],
  controllers: [AccessLineController, AccessLineTwilioController],
  providers: [AccessLineService, AccessLineAdapters, TranslateAuthGuard],
  exports: [AccessLineService],
})
export class AccessLineModule {}
