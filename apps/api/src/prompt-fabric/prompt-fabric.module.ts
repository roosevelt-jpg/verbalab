import { Module } from '@nestjs/common';
import { PromptFabricController } from './prompt-fabric.controller';
import { PromptFabricService } from './prompt-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromptRuntimeModule } from '../prompt-runtime/prompt-runtime.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    PromptRuntimeModule,
    PolicyRuntimeModule,
    EventFabricModule,
    ApiKeysModule,
  ],
  controllers: [PromptFabricController],
  providers: [PromptFabricService, TranslateAuthGuard],
  exports: [PromptFabricService],
})
export class PromptFabricModule {}
