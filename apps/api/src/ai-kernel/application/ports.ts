/** Application ports for AI Kernel (VL-214). Implemented by Nest adapters. */

export type KernelRuntimeRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type KernelArchitectureNotes = ReturnType<
  typeof import('../ai-kernel.catalog').aiKernelArchitectureNotes
>;

export type KernelProductsBundle = {
  product: string;
  products: KernelRuntimeRow[];
  architecture: KernelArchitectureNotes;
  safety: ReturnType<typeof import('../ai-kernel.catalog').aiKernelSafetyNotes>;
  docs: string;
  note: string;
};

export interface AiKernelCatalogPort {
  products(): KernelProductsBundle;
  listProducts(): KernelRuntimeRow[];
}

export const AI_KERNEL_CATALOG_PORT = Symbol('AI_KERNEL_CATALOG_PORT');
