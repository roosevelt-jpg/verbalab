import { Module } from '@nestjs/common';
import { EventFabricController } from './event-fabric.controller';
import { EventFabricService } from './event-fabric.service';
import { EventFabricBus } from './event-fabric.bus';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [EventFabricController],
  providers: [EventFabricBus, EventFabricService],
  exports: [EventFabricService, EventFabricBus],
})
export class EventFabricModule {}
