import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BenchmarkPlatformModule } from '../benchmark-platform.module';
import { BENCHMARK_PLATFORM_CATALOG_PORT } from './ports';
import { NestBenchmarkPlatformCatalogAdapter } from './nest-benchmark-platform.adapter';
import { BENCHMARK_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, BenchmarkPlatformModule],
  providers: [
    NestBenchmarkPlatformCatalogAdapter,
    { provide: BENCHMARK_PLATFORM_CATALOG_PORT, useExisting: NestBenchmarkPlatformCatalogAdapter },
    ...BENCHMARK_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class BenchmarkPlatformApplicationModule {}
