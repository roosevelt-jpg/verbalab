import { Module } from '@nestjs/common';
import { CoverageController } from './coverage.controller';
import { EvalService } from './eval.service';
import { GatewayModule } from '../gateway/gateway.module';
import { LanguagesModule } from '../languages/languages.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [GatewayModule, LanguagesModule, IdentityModule],
  controllers: [CoverageController],
  providers: [EvalService],
  exports: [EvalService],
})
export class EvalModule {}
