import { Module } from '@nestjs/common';
import { CreativeMediaController } from './creative-media.controller';
import { CreativeMediaService } from './creative-media.service';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [AuditCoreModule, ApiKeysModule, IdentityModule, RateLimitModule],
  controllers: [CreativeMediaController],
  providers: [CreativeMediaService, TranslateAuthGuard],
  exports: [CreativeMediaService],
})
export class CreativeMediaModule {}
