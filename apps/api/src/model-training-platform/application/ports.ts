/** Application ports for Model Training Platform. */

export type MtpMethodRow = {
  id: string;
  name: string;
  status: string;
  launchable: boolean;
  existingApi: string | null;
  notes: string;
};

export type MtpEngineBundle = ReturnType<
  import('../model-training-platform.service').ModelTrainingPlatformService['engine']
>;

export interface ModelTrainingPlatformCatalogPort {
  engine: MtpEngineBundle;
  listMethods: MtpMethodRow[];
}

export const MODEL_TRAINING_PLATFORM_CATALOG_PORT = Symbol(
  'MODEL_TRAINING_PLATFORM_CATALOG_PORT',
);
