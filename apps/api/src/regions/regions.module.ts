import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { ResidencyInterceptor } from './residency.interceptor';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [RegionsController],
  providers: [
    RegionsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResidencyInterceptor,
    },
  ],
  exports: [RegionsService],
})
export class RegionsModule {}
