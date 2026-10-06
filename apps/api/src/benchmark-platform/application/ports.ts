/** Application ports for Benchmark Platform (VL-274). */

export type BenchmarkPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type BenchmarkPlatformEngineBundle = ReturnType<
  import('../benchmark-platform.service').BenchmarkPlatformService['engine']
>;

export interface BenchmarkPlatformCatalogPort {
  engine(): BenchmarkPlatformEngineBundle;
  listProducts(): BenchmarkPlatformProductRow[];
}

export const BENCHMARK_PLATFORM_CATALOG_PORT = Symbol('BENCHMARK_PLATFORM_CATALOG_PORT');
