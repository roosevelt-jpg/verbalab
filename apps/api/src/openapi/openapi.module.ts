import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { OpenApiController } from './openapi.controller';

@Module({
  imports: [DiscoveryModule],
  controllers: [OpenApiController],
})
export class OpenApiModule {}
