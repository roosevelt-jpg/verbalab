/** Application ports for Secrets & Certificate Platform (VL-320). */

export type SecretsCertificatePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type SecretsCertificatePlatformEngineBundle = ReturnType<
  import('../secrets-certificate-platform.service').SecretsCertificatePlatformService['engine']
>;

export interface SecretsCertificatePlatformCatalogPort {
  engine(): SecretsCertificatePlatformEngineBundle;
  listProducts(): SecretsCertificatePlatformProductRow[];
}

export const SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT = Symbol('SECRETS_CERTIFICATE_PLATFORM_CATALOG_PORT');
