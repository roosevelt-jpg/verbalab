import { Module } from '@nestjs/common';
import { ModelRegistryController } from './model-registry.controller';
import { ModelRegistryService } from './model-registry.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [UsageModule, IdentityModule, ModelsModule],
  controllers: [ModelRegistryController],
  providers: [ModelRegistryService],
  exports: [ModelRegistryService],
})
export class ModelRegistryModule {}
