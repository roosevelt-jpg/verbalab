import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { IdentityModule } from '../identity/identity.module';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';

@Module({
  imports: [IdentityModule],
  controllers: [ModelsController],
  providers: [ModelsService, PlatformAdminGuard],
  exports: [ModelsService],
})
export class ModelsModule {}
