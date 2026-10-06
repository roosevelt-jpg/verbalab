import { Module } from '@nestjs/common';
import { AiFabricController } from './ai-fabric.controller';
import { AiFabricService } from './ai-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [AiFabricController],
  providers: [AiFabricService],
  exports: [AiFabricService],
})
export class AiFabricModule {}
