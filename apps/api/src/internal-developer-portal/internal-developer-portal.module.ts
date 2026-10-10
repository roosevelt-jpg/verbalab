import { Module } from '@nestjs/common';
import { InternalDeveloperPortalController } from './internal-developer-portal.controller';
import { InternalDeveloperPortalService } from './internal-developer-portal.service';

@Module({
  controllers: [InternalDeveloperPortalController],
  providers: [InternalDeveloperPortalService],
  exports: [InternalDeveloperPortalService],
})
export class InternalDeveloperPortalModule {}
