import { Module } from '@nestjs/common';
import { IdentityFederationController } from './identity-federation.controller';
import { IdentityFederationService } from './identity-federation.service';

@Module({
  controllers: [IdentityFederationController],
  providers: [IdentityFederationService],
  exports: [IdentityFederationService],
})
export class IdentityFederationModule {}
