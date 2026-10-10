import { Module } from '@nestjs/common';
import { SupplyChainSecurityController } from './supply-chain-security.controller';
import { SupplyChainSecurityService } from './supply-chain-security.service';

@Module({
  controllers: [SupplyChainSecurityController],
  providers: [SupplyChainSecurityService],
  exports: [SupplyChainSecurityService],
})
export class SupplyChainSecurityModule {}
