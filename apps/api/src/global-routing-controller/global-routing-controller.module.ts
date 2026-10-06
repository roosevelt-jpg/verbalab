import { Module } from '@nestjs/common';
import { GlobalRoutingControllerController } from './global-routing-controller.controller';
import { GlobalRoutingControllerService } from './global-routing-controller.service';

@Module({
  controllers: [GlobalRoutingControllerController],
  providers: [GlobalRoutingControllerService],
  exports: [GlobalRoutingControllerService],
})
export class GlobalRoutingControllerModule {}
