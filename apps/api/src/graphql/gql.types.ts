import { Field, Float, Int, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class DetectDialectInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class CheckGrammarInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class SuggestWritingInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => String, { nullable: true })
  styleProfile?: string;
}

@ObjectType()
export class GqlGrammarIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlGrammarSuggestResult {
  @Field()
  language!: string;

  @Field()
  original!: string;

  @Field()
  grammarCorrected!: string;

  @Field()
  styleRewritten!: string;

  @Field()
  styleProfile!: string;

  @Field(() => Int)
  suggestionCount!: number;

  @Field()
  changed!: boolean;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@InputType()
export class DetectToneInput {
  @Field()
  text!: string;
}

@InputType()
export class TransformToneInput {
  @Field()
  text!: string;

  @Field()
  targetTone!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class TransferStyleInput {
  @Field()
  text!: string;

  @Field()
  targetProfile!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlToneDetectResult {
  @Field()
  detectedTone!: string;

  @Field(() => Float)
  confidence!: number;

  @Field()
  suggestedProfile!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleTransferResult {
  @Field()
  sourceTone!: string;

  @Field(() => Float)
  sourceConfidence!: number;

  @Field()
  targetProfile!: string;

  @Field()
  rewritten!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  changeCount!: number;

  @Field()
  note!: string;
}

@InputType()
export class RewriteStyleInput {
  @Field()
  text!: string;

  @Field()
  profile!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlLanguage {
  @Field()
  code!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  nameNative!: string | null;

  @Field(() => String, { nullable: true })
  script!: string | null;

  @Field(() => String, { nullable: true })
  familyCode!: string | null;

  @Field()
  rtl!: boolean;

  @Field()
  tier!: string;
}

@ObjectType()
export class GqlDialect {
  @Field()
  code!: string;

  @Field()
  languageCode!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => [String])
  cueTerms!: string[];
}

@ObjectType()
export class GqlAccent {
  @Field()
  code!: string;

  @Field()
  languageCode!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => String, { nullable: true })
  relatedDialectCode!: string | null;
}

@ObjectType()
export class GqlLocalePack {
  @Field()
  languageCode!: string;

  @Field(() => String, { nullable: true })
  bcp47!: string | null;

  @Field(() => String, { nullable: true })
  currencyCode!: string | null;

  @Field(() => String, { nullable: true })
  culturalNotes!: string | null;
}

@ObjectType()
export class GqlCountryPack {
  @Field()
  code!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => String, { nullable: true })
  currencyCode!: string | null;

  @Field(() => [String])
  primaryLanguages!: string[];

  @Field(() => [String])
  bcp47Tags!: string[];
}

@ObjectType()
export class GqlStyleProfile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;
}

@ObjectType()
export class GqlLanguageProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeechProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlIntelligenceProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlInferenceProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAiKernelRuntime {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlFoundationModelCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  modality!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlModelTrainingMethod {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field()
  launchable!: boolean;

  @Field(() => String, { nullable: true })
  existingApi!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlModelEvaluationSuite {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field()
  runnable!: boolean;

  @Field(() => String, { nullable: true })
  existingApi!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlModelRegistryCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAtlasCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAiFabricBus {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEcosystemProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPluginMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPluginMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPluginMarketplaceCapability])
  capabilities!: GqlPluginMarketplaceCapability[];

  @Field()
  liveCodeExecution!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  pluginPolicyHardGateRequired!: boolean;
}

@ObjectType()
export class GqlModelMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlModelMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlModelMarketplaceCapability])
  capabilities!: GqlModelMarketplaceCapability[];

  @Field()
  huggingFaceOs!: boolean;

  @Field()
  weightHostingOs!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlDatasetMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlDatasetMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlDatasetMarketplaceCapability])
  capabilities!: GqlDatasetMarketplaceCapability[];

  @Field()
  labelStudioOs!: boolean;

  @Field()
  datasetCloudOs!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlPromptMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPromptMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPromptMarketplaceCapability])
  capabilities!: GqlPromptMarketplaceCapability[];

  @Field()
  promptMeshOs!: boolean;

  @Field()
  autoPromptResearchOs!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlAgentMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAgentMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAgentMarketplaceCapability])
  capabilities!: GqlAgentMarketplaceCapability[];

  @Field()
  liveToolExecution!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  agentPolicyHardGateRequired!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlWorkflowMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlWorkflowMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlWorkflowMarketplaceCapability])
  capabilities!: GqlWorkflowMarketplaceCapability[];

  @Field()
  liveStepExecution!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  workflowPolicyHardGateRequired!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlConnectorMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlConnectorMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlConnectorMarketplaceCapability])
  capabilities!: GqlConnectorMarketplaceCapability[];

  @Field()
  liveConnectorExecution!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  fabricPolicyHardGateRequired!: boolean;

  @Field()
  ipaasOs!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlVoiceLanguageMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceLanguageMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceLanguageMarketplaceCapability])
  capabilities!: GqlVoiceLanguageMarketplaceCapability[];

  @Field()
  thirdPartyVoiceOs!: boolean;

  @Field()
  voiceCdnOs!: boolean;

  @Field()
  celebrityWithoutRights!: boolean;

  @Field()
  crossTenantCloneSynthesis!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlCreatorEconomyCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlCreatorEconomyEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlCreatorEconomyCapability])
  capabilities!: GqlCreatorEconomyCapability[];

  @Field()
  paymentProcessorOs!: boolean;

  @Field()
  taxHandlingComplete!: boolean;

  @Field()
  disputeChargebackComplete!: boolean;

  @Field()
  creatorPayoutMathVerifiedLive!: boolean;

  @Field()
  creatorPayoutMathHandCheckedInTests!: boolean;

  @Field()
  storesRawCardData!: boolean;

  @Field()
  stripeOrEquivalentRequired!: boolean;
}

@ObjectType()
export class GqlEventFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEventFabricBroker {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field()
  protocol!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlContextFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlContextFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPromptFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPromptFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlReasoningFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlReasoningFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlMemoryFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlMemoryFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAgentFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAgentFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPolicyFabricCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPolicyFabricRoute {
  @Field()
  kind!: string;

  @Field()
  name!: string;

  @Field()
  target!: string;

  @Field()
  api!: string;

  @Field()
  cloud!: string;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlMemoryRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlMemoryRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlMemoryRuntimeCapability])
  capabilities!: GqlMemoryRuntimeCapability[];

  @Field()
  mem0Os!: boolean;

  @Field()
  infinitePersonalizationOs!: boolean;

  @Field()
  replicationOs!: boolean;

  @Field()
  encryptionKmsOs!: boolean;

  @Field()
  regeneratesMemoryCloud!: boolean;

  @Field()
  regeneratesKnowledgeMemory!: boolean;

  @Field()
  extendsMemoryCloud!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  kernelLayerOnly!: boolean;

  @Field()
  vectorSemanticOs!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxEntriesPerWorkspace!: number;
}

@ObjectType()
export class GqlPromptRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPromptRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPromptRuntimeCapability])
  capabilities!: GqlPromptRuntimeCapability[];

  @Field()
  autoPromptResearchLab!: boolean;

  @Field()
  llmAsJudgeEvalLab!: boolean;

  @Field()
  promptMeshOs!: boolean;

  @Field()
  redisPromptCacheOs!: boolean;

  @Field()
  callsLlmOnExecute!: boolean;

  @Field()
  regeneratesPromptIntelligence!: boolean;

  @Field()
  regeneratesVl086!: boolean;

  @Field()
  extendsPromptIntelligence!: boolean;

  @Field()
  extendsVersionedPrompts!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  usesIntelligentCachePromptNamespace!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxRenderedChars!: number;
}

@ObjectType()
export class GqlContextRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlContextRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlContextRuntimeCapability])
  capabilities!: GqlContextRuntimeCapability[];

  @Field()
  infiniteContextWindow!: boolean;

  @Field()
  llmSummarization!: boolean;

  @Field()
  realtimePush!: boolean;

  @Field()
  regeneratesContextEngine!: boolean;

  @Field()
  extendsContextEngine!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  redisContextCacheOs!: boolean;

  @Field()
  usesIntelligentCacheContextNamespace!: boolean;

  @Field()
  modelRouterOs!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxChars!: number;
}

@ObjectType()
export class GqlReasoningRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlReasoningRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlReasoningRuntimeCapability])
  capabilities!: GqlReasoningRuntimeCapability[];

  @Field()
  customReasonerKernel!: boolean;

  @Field()
  symbolicReasonerOs!: boolean;

  @Field()
  fullTreeOfThought!: boolean;

  @Field()
  toolExecution!: boolean;

  @Field()
  agentOs!: boolean;

  @Field()
  llmAsJudgeEvalLab!: boolean;

  @Field()
  droolsPegaBrms!: boolean;

  @Field()
  regeneratesReasoningCloud!: boolean;

  @Field()
  extendsReasoningCloud!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  storesHistoryInMemoryCloud!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxHistoryPerWorkspace!: number;
}

@ObjectType()
export class GqlAgentRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAgentRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAgentRuntimeCapability])
  capabilities!: GqlAgentRuntimeCapability[];

  @Field()
  openToolExecution!: boolean;

  @Field()
  liveExternalActionsByDefault!: boolean;

  @Field()
  langGraphOs!: boolean;

  @Field()
  autoGptOs!: boolean;

  @Field()
  scopedPermissionsRequired!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  policyHardGateRequired!: boolean;

  @Field()
  policyRuntimeWired!: boolean;

  @Field()
  localPermissionHardGate!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxAgentsPerWorkspace!: number;
}

@ObjectType()
export class GqlWorkflowRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlWorkflowRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlWorkflowRuntimeCapability])
  capabilities!: GqlWorkflowRuntimeCapability[];

  @Field()
  openToolExecution!: boolean;

  @Field()
  liveStepExecution!: boolean;

  @Field()
  temporalOs!: boolean;

  @Field()
  airflowOs!: boolean;

  @Field()
  distributedWorkflowOs!: boolean;

  @Field()
  extendsWorkflowsProduct!: boolean;

  @Field()
  regeneratesWorkflowsProduct!: boolean;

  @Field()
  scopedPermissionsRequired!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  policyHardGateRequired!: boolean;

  @Field()
  policyRuntimeWired!: boolean;

  @Field()
  localPermissionHardGate!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxWorkflowsPerWorkspace!: number;
}

@ObjectType()
export class GqlPluginRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPluginRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPluginRuntimeCapability])
  capabilities!: GqlPluginRuntimeCapability[];

  @Field()
  openToolExecution!: boolean;

  @Field()
  liveCodeExecution!: boolean;

  @Field()
  browserExtensionOs!: boolean;

  @Field()
  vsCodeExtensionOs!: boolean;

  @Field()
  wasmPluginOs!: boolean;

  @Field()
  extendsMarketplace!: boolean;

  @Field()
  regeneratesMarketplace!: boolean;

  @Field()
  scopedPermissionsRequired!: boolean;

  @Field()
  sandboxRequired!: boolean;

  @Field()
  policyHardGateRequired!: boolean;

  @Field()
  policyRuntimeWired!: boolean;

  @Field()
  localPermissionHardGate!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxPluginsPerWorkspace!: number;
}

@ObjectType()
export class GqlPolicyRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPolicyRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPolicyRuntimeCapability])
  capabilities!: GqlPolicyRuntimeCapability[];

  @Field()
  hardGate!: boolean;

  @Field()
  logOnly!: boolean;

  @Field()
  logOnlyForbidden!: boolean;

  @Field()
  opaOs!: boolean;

  @Field()
  cedarOs!: boolean;

  @Field()
  enterpriseGrcOs!: boolean;

  @Field()
  wiredIntoAgentRuntime!: boolean;

  @Field()
  wiredIntoWorkflowRuntime!: boolean;

  @Field()
  wiredIntoPluginRuntime!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxPoliciesPerWorkspace!: number;
}

@ObjectType()
export class GqlGpuPlatformCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlGpuPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlGpuPlatformCapability])
  capabilities!: GqlGpuPlatformCapability[];

  @Field()
  gpuHyperscalerOs!: boolean;

  @Field()
  callsCloudGpuApis!: boolean;

  @Field()
  openEndedGpuAutoscale!: boolean;

  @Field()
  hardSpendCeilingsRequired!: boolean;

  @Field()
  sandboxLogicalOnly!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  maxInstances!: number;

  @Field()
  maxSpendUsd!: number;

  @Field()
  provisionMode!: string;
}

@ObjectType()
export class GqlModelServingCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlModelServingEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlModelServingCapability])
  capabilities!: GqlModelServingCapability[];

  @Field()
  vllmOs!: boolean;

  @Field()
  kserveOs!: boolean;

  @Field()
  tritonOs!: boolean;

  @Field()
  selfHostedGpuServingOs!: boolean;

  @Field()
  regeneratesAiGateway!: boolean;

  @Field()
  extendsAiGateway!: boolean;

  @Field()
  extendsModelRegistry!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  sandboxDeploymentsOnly!: boolean;

  @Field()
  maxActiveDeployments!: number;

  @Field()
  servingMode!: string;
}

@ObjectType()
export class GqlAiRouterCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAiRouterEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAiRouterCapability])
  capabilities!: GqlAiRouterCapability[];

  @Field()
  serviceMeshOs!: boolean;

  @Field()
  multiCloudRouterOs!: boolean;

  @Field()
  regeneratesAiGateway!: boolean;

  @Field()
  extendsAiGateway!: boolean;

  @Field()
  extendsModelServing!: boolean;

  @Field()
  dryRunResolveOnly!: boolean;

  @Field()
  enforcesSpendCaps!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  primaryRegion!: string;

  @Field()
  mode!: string;
}

@ObjectType()
export class GqlStreamingRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlStreamingRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlStreamingRuntimeCapability])
  capabilities!: GqlStreamingRuntimeCapability[];

  @Field()
  websocketOs!: boolean;

  @Field()
  grpcStreamingOs!: boolean;

  @Field()
  videoStreamingOs!: boolean;

  @Field()
  bidirectionalRealtimeOs!: boolean;

  @Field()
  regeneratesExistingStreams!: boolean;

  @Field()
  extendsExistingSse!: boolean;

  @Field()
  sandboxChunkStream!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  primaryTransport!: string;

  @Field()
  mode!: string;

  @Field()
  maxChunksPerStream!: number;
}

@ObjectType()
export class GqlBatchRuntimeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlBatchRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlBatchRuntimeCapability])
  capabilities!: GqlBatchRuntimeCapability[];

  @Field()
  sparkOs!: boolean;

  @Field()
  airflowOs!: boolean;

  @Field()
  celeryOs!: boolean;

  @Field()
  distributedBatchOs!: boolean;

  @Field()
  regeneratesJobsApi!: boolean;

  @Field()
  extendsBullMqJobs!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  sandboxRunsForNonTranslate!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxItemsPerRun!: number;

  @Field()
  maxRetries!: number;
}

@ObjectType()
export class GqlIntelligentCacheCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlIntelligentCacheEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlIntelligentCacheCapability])
  capabilities!: GqlIntelligentCacheCapability[];

  @Field()
  redisClusterOs!: boolean;

  @Field()
  vectorSemanticOs!: boolean;

  @Field()
  cdnOs!: boolean;

  @Field()
  autoWiresGatewayResponses!: boolean;

  @Field()
  regeneratesAiGateway!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  sandboxEntries!: boolean;

  @Field()
  exactKeyLookup!: boolean;

  @Field()
  mode!: string;

  @Field()
  maxEntriesPerWorkspace!: number;

  @Field()
  defaultTtlSec!: number;
}

@ObjectType()
export class GqlCostOptimizationCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlCostOptimizationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlCostOptimizationCapability])
  capabilities!: GqlCostOptimizationCapability[];

  @Field()
  finOpsOs!: boolean;

  @Field()
  cloudSpotApis!: boolean;

  @Field()
  reservedInstanceMarketplace!: boolean;

  @Field()
  openEndedAutoscale!: boolean;

  @Field()
  regeneratesAiGateway!: boolean;

  @Field()
  enforcesSpendCaps!: boolean;

  @Field()
  reportOnly!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsGpuPlatform!: boolean;

  @Field()
  extendsAiRouter!: boolean;

  @Field()
  mode!: string;

  @Field()
  defaultDailyCapUsd!: number;

  @Field()
  defaultMonthlyCapUsd!: number;
}

@ObjectType()
export class GqlAiRuntimeAnalyticsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAiRuntimeAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAiRuntimeAnalyticsCapability])
  capabilities!: GqlAiRuntimeAnalyticsCapability[];

  @Field()
  biDashboardOs!: boolean;

  @Field()
  apmOs!: boolean;

  @Field()
  cloudGpuTelemetryOs!: boolean;

  @Field()
  regeneratesIntelligenceAnalytics!: boolean;

  @Field()
  regeneratesKnowledgeAnalytics!: boolean;

  @Field()
  enterpriseReportingSuite!: boolean;

  @Field()
  aggregatesOnly!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsInferenceCloud!: boolean;

  @Field()
  mode!: string;
}

@ObjectType()
export class GqlKnowledgeBaseCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeBaseEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeBaseCapability])
  capabilities!: GqlKnowledgeBaseCapability[];

  @Field()
  confluenceOs!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsVl062!: boolean;
}

@ObjectType()
export class GqlEnterpriseSearchCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEnterpriseSearchEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlEnterpriseSearchCapability])
  capabilities!: GqlEnterpriseSearchCapability[];

  @Field()
  elasticOs!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsVl062!: boolean;
}

@ObjectType()
export class GqlOntologyCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlOntologyEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlOntologyCapability])
  capabilities!: GqlOntologyCapability[];

  @Field()
  owlOs!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsVl184!: boolean;
}

@ObjectType()
export class GqlTaxonomyCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlTaxonomyEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlTaxonomyCapability])
  capabilities!: GqlTaxonomyCapability[];

  @Field()
  enterpriseTaxonomyOs!: boolean;

  @Field()
  mlAutoClassification!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;
}

@ObjectType()
export class GqlEnterpriseRagCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEnterpriseRagEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlEnterpriseRagCapability])
  capabilities!: GqlEnterpriseRagCapability[];

  @Field()
  langchainOs!: boolean;

  @Field()
  agenticRagOs!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsVl062!: boolean;

  @Field()
  handVerifyRequired!: boolean;
}

@ObjectType()
export class GqlKnowledgeMemoryCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeMemoryEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeMemoryCapability])
  capabilities!: GqlKnowledgeMemoryCapability[];

  @Field()
  mem0Os!: boolean;

  @Field()
  regeneratesMemoryCloud!: boolean;

  @Field()
  extendsVl183!: boolean;

  @Field()
  distinctFromMemoryCloud!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;
}

@ObjectType()
export class GqlKnowledgeIntelligenceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeIntelligenceCapability])
  capabilities!: GqlKnowledgeIntelligenceCapability[];

  @Field()
  biOs!: boolean;

  @Field()
  regeneratesIntelligenceAnalytics!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;

  @Field()
  extendsKnowledgeCloud!: boolean;
}

@ObjectType()
export class GqlKnowledgeApisCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeApisEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeApisCapability])
  capabilities!: GqlKnowledgeApisCapability[];

  @Field()
  grpcOs!: boolean;

  @Field()
  kafkaEventStreamingOs!: boolean;

  @Field()
  sdkGeneratorOs!: boolean;

  @Field()
  extendsExistingKnowledgeApis!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;
}

@ObjectType()
export class GqlEmbeddingCloudCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEmbeddingCloudEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlEmbeddingCloudCapability])
  capabilities!: GqlEmbeddingCloudCapability[];

  @Field()
  trainsEmbeddingModels!: boolean;

  @Field()
  multimodalOs!: boolean;
}

@ObjectType()
export class GqlVectorCloudCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVectorCloudEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVectorCloudCapability])
  capabilities!: GqlVectorCloudCapability[];

  @Field()
  managedVectorDbOs!: boolean;

  @Field()
  pineconeParity!: boolean;

  @Field()
  hybridBm25!: boolean;
}

@ObjectType()
export class GqlMemoryCloudCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlMemoryCloudEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlMemoryCloudCapability])
  capabilities!: GqlMemoryCloudCapability[];

  @Field()
  infinitePersonalizationOs!: boolean;

  @Field()
  gdprExport!: boolean;

  @Field()
  gdprErase!: boolean;
}

@ObjectType()
export class GqlKnowledgeGraphCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeGraphEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeGraphCapability])
  capabilities!: GqlKnowledgeGraphCapability[];

  @Field()
  neo4jParity!: boolean;

  @Field()
  ontologyPlatform!: boolean;

  @Field()
  preferRag!: boolean;
}

@ObjectType()
export class GqlContextEngineCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlContextEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlContextEngineCapability])
  capabilities!: GqlContextEngineCapability[];

  @Field()
  infiniteContextWindow!: boolean;

  @Field()
  llmSummarization!: boolean;

  @Field()
  realtimePush!: boolean;
}

@ObjectType()
export class GqlReasoningCloudCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlReasoningCloudEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlReasoningCloudCapability])
  capabilities!: GqlReasoningCloudCapability[];

  @Field()
  customReasonerKernel!: boolean;

  @Field()
  symbolicReasonerOs!: boolean;

  @Field()
  llmGateway!: boolean;
}

@ObjectType()
export class GqlRecommendationEngineCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlRecommendationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlRecommendationEngineCapability])
  capabilities!: GqlRecommendationEngineCapability[];

  @Field()
  retailRecommenderOs!: boolean;

  @Field()
  collaborativeFiltering!: boolean;

  @Field()
  lightRankers!: boolean;
}

@ObjectType()
export class GqlPromptIntelligenceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPromptIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPromptIntelligenceCapability])
  capabilities!: GqlPromptIntelligenceCapability[];

  @Field()
  autoPromptResearchLab!: boolean;

  @Field()
  trainsPromptOptimizers!: boolean;

  @Field()
  extendsVersionedPrompts!: boolean;
}

@ObjectType()
export class GqlDecisionEngineCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlDecisionEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlDecisionEngineCapability])
  capabilities!: GqlDecisionEngineCapability[];

  @Field()
  enterpriseBrms!: boolean;

  @Field()
  droolsPegaParity!: boolean;

  @Field()
  lightRules!: boolean;
}

@ObjectType()
export class GqlAiOrchestrationCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAiOrchestration {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAiOrchestrationCapability])
  capabilities!: GqlAiOrchestrationCapability[];

  @Field()
  multiCloudAgentOs!: boolean;

  @Field()
  langGraphOs!: boolean;

  @Field()
  loadBearingE2e!: boolean;
}

@ObjectType()
export class GqlIntelligenceAnalyticsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlIntelligenceAnalytics {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlIntelligenceAnalyticsCapability])
  capabilities!: GqlIntelligenceAnalyticsCapability[];

  @Field()
  regeneratesSpeechAnalytics!: boolean;

  @Field()
  regeneratesVoiceAnalytics!: boolean;

  @Field()
  biDashboardOs!: boolean;

  @Field()
  aggregatesOnly!: boolean;
}

@ObjectType()
export class GqlKnowledgeAnalyticsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlKnowledgeAnalytics {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlKnowledgeAnalyticsCapability])
  capabilities!: GqlKnowledgeAnalyticsCapability[];

  @Field()
  regeneratesLanguageAnalytics!: boolean;

  @Field()
  regeneratesSpeechAnalytics!: boolean;

  @Field()
  regeneratesVoiceAnalytics!: boolean;

  @Field()
  regeneratesIntelligenceAnalytics!: boolean;

  @Field()
  biDashboardOs!: boolean;

  @Field()
  aggregatesOnly!: boolean;

  @Field()
  orgWorkspaceScoped!: boolean;
}

@ObjectType()
export class GqlSpeechCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeechEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlSpeechCapability])
  capabilities!: GqlSpeechCapability[];
}

@ObjectType()
export class GqlNeuralTtsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlNeuralTtsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlNeuralTtsCapability])
  capabilities!: GqlNeuralTtsCapability[];
}

@ObjectType()
export class GqlNeuralTtsVoice {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  gender!: string;

  @Field(() => [String])
  languages!: string[];

  @Field()
  provider!: string;

  @Field()
  personality!: string;

  @Field()
  ageGroup!: string;

  @Field(() => String, { nullable: true })
  dialect!: string | null;

  @Field(() => String, { nullable: true })
  accent!: string | null;

  @Field()
  category!: string;
}

@ObjectType()
export class GqlVoiceCloningCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceCloningEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceCloningCapability])
  capabilities!: GqlVoiceCloningCapability[];

  @Field()
  consentRequired!: boolean;

  @Field()
  watermarkRequired!: boolean;
}

@ObjectType()
export class GqlEmotionVoiceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEmotionVoiceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlEmotionVoiceCapability])
  capabilities!: GqlEmotionVoiceCapability[];

  @Field()
  trainedExpressiveModel!: boolean;
}

@ObjectType()
export class GqlEmotionVoiceProfile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field()
  description!: string;

  @Field()
  preferredVoice!: string;
}

@ObjectType()
export class GqlVoiceStudioCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceStudioEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceStudioCapability])
  capabilities!: GqlVoiceStudioCapability[];

  @Field()
  nonlinearDaw!: boolean;
}

@ObjectType()
export class GqlVoiceEnhancementCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceEnhancementEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceEnhancementCapability])
  capabilities!: GqlVoiceEnhancementCapability[];

  @Field()
  spectralMlDenoise!: boolean;

  @Field()
  liveAec!: boolean;
}

@ObjectType()
export class GqlVoiceEnhancementProfile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field()
  description!: string;
}

@ObjectType()
export class GqlVoiceBiometricsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceBiometricsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceBiometricsCapability])
  capabilities!: GqlVoiceBiometricsCapability[];

  @Field()
  nistCertified!: boolean;

  @Field()
  padCertified!: boolean;
}

@ObjectType()
export class GqlVoiceMarketplaceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceMarketplaceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceMarketplaceCapability])
  capabilities!: GqlVoiceMarketplaceCapability[];

  @Field()
  celebrityWithoutRights!: boolean;

  @Field()
  crossTenantCloneSynthesis!: boolean;
}

@ObjectType()
export class GqlVoiceAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field()
  capabilityCount!: number;

  @Field()
  shippedCount!: number;

  @Field()
  regeneratesSpeechAnalytics!: boolean;

  @Field()
  biDashboardProduct!: boolean;
}

@ObjectType()
export class GqlVoiceAnalyticsOverview {
  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field()
  estimatedCostUsd!: number;

  @Field()
  ttsRequests!: number;

  @Field()
  revenueCents!: number;
}

@ObjectType()
export class GqlSpeechVocabPack {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => [String])
  phrases!: string[];
}

@ObjectType()
export class GqlSpeakerCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeakerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlSpeakerCapability])
  capabilities!: GqlSpeakerCapability[];
}

@ObjectType()
export class GqlSpeakerProfile {
  @Field()
  id!: string;

  @Field()
  displayName!: string;

  @Field()
  status!: string;

  @Field()
  enrolled!: boolean;

  @Field()
  enrollmentCount!: number;
}

@ObjectType()
export class GqlAccentCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAccentEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAccentCapability])
  capabilities!: GqlAccentCapability[];
}

@InputType()
export class DetectAccentInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlAccentDetectResult {
  @Field()
  language!: string;

  @Field(() => String, { nullable: true })
  accent!: string | null;

  @Field(() => String, { nullable: true })
  accentName!: string | null;

  @Field()
  confidence!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlEmotionCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEmotionEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [String])
  labels!: string[];

  @Field(() => [GqlEmotionCapability])
  capabilities!: GqlEmotionCapability[];
}

@InputType()
export class DetectEmotionInput {
  @Field()
  text!: string;
}

@ObjectType()
export class GqlEmotionDetectResult {
  @Field()
  label!: string;

  @Field()
  confidence!: number;

  @Field()
  audioAdjusted!: boolean;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlAudioCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAudioEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAudioCapability])
  capabilities!: GqlAudioCapability[];
}

@ObjectType()
export class GqlPronunciationCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPronunciationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPronunciationCapability])
  capabilities!: GqlPronunciationCapability[];
}

@ObjectType()
export class GqlPronunciationScores {
  @Field()
  overall!: number;

  @Field()
  accuracy!: number;

  @Field()
  fluency!: number;

  @Field()
  stress!: number;
}

@InputType()
export class AssessPronunciationInput {
  @Field()
  reference!: string;

  @Field({ nullable: true })
  hypothesis?: string;

  @Field({ nullable: true })
  language?: string;
}

@ObjectType()
export class GqlPronunciationAssessResult {
  @Field()
  language!: string;

  @Field()
  hypothesis!: string;

  @Field(() => GqlPronunciationScores)
  scores!: GqlPronunciationScores;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlWakeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlWakeWordEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [String])
  defaultWakePhrases!: string[];

  @Field(() => [GqlWakeCapability])
  capabilities!: GqlWakeCapability[];
}

@InputType()
export class DetectWakeWordInput {
  @Field()
  text!: string;
}

@ObjectType()
export class GqlWakeDetectResult {
  @Field()
  wakeDetected!: boolean;

  @Field()
  transcript!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlCallCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlCallIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlCallCapability])
  capabilities!: GqlCallCapability[];
}

@InputType()
export class IngestCallInput {
  @Field()
  transcript!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => String, { nullable: true })
  direction?: string;

  @Field(() => String, { nullable: true })
  externalRef?: string;
}

@ObjectType()
export class GqlCallRecord {
  @Field()
  id!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  summary?: string | null;

  @Field(() => String, { nullable: true })
  transcript?: string | null;
}

@ObjectType()
export class GqlSpeechAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field()
  capabilityCount!: number;

  @Field()
  shippedCount!: number;
}

@ObjectType()
export class GqlSpeechAnalyticsOverview {
  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field()
  estimatedCostUsd!: number;

  @Field()
  sttRequests!: number;

  @Field()
  ttsRequests!: number;
}

@InputType()
export class TranslateInput {
  @Field()
  text!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;
}

@InputType()
export class TranslateFormatInput {
  @Field()
  format!: string;

  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;
}

@ObjectType()
export class GqlTranslateResult {
  @Field()
  text!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field()
  provider!: string;

  @Field(() => Int)
  characters!: number;

  @Field()
  tmHit!: boolean;

  @Field(() => Int)
  glossaryApplied!: number;
}

@ObjectType()
export class GqlTranslateFormatResult {
  @Field()
  format!: string;

  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field(() => Int)
  segmentCount!: number;

  @Field(() => Int)
  characters!: number;

  @Field()
  provider!: string;

  @Field(() => String, { nullable: true })
  note!: string | null;
}

@ObjectType()
export class GqlTranslateEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@InputType()
export class LocalizeInput {
  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field({ nullable: true })
  format?: string;
}

@InputType()
export class ValidateIcuInput {
  @Field()
  message!: string;
}

@InputType()
export class FormatIcuInput {
  @Field()
  message!: string;

  @Field(() => String, { nullable: true })
  valuesJson?: string;

  @Field(() => String, { nullable: true })
  locale?: string;
}

@ObjectType()
export class GqlLocalizeResult {
  @Field()
  format!: string;

  @Field()
  serialized!: string;

  @Field(() => Int)
  strings!: number;

  @Field(() => Int)
  translated!: number;

  @Field(() => Int)
  tmHits!: number;
}

@ObjectType()
export class GqlIcuValidateResult {
  @Field()
  valid!: boolean;

  @Field(() => [String])
  placeholders!: string[];

  @Field()
  hasPlural!: boolean;

  @Field()
  hasSelect!: boolean;

  @Field(() => [String])
  issueMessages!: string[];
}

@ObjectType()
export class GqlIcuFormatResult {
  @Field()
  formatted!: string;

  @Field(() => [String])
  placeholders!: string[];

  @Field()
  locale!: string;
}

@ObjectType()
export class GqlLocalizationPlatform {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlDialectDetectResult {
  @Field()
  language!: string;

  @Field(() => String, { nullable: true })
  dialect!: string | null;

  @Field(() => String, { nullable: true })
  dialectName!: string | null;

  @Field(() => Float)
  confidence!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlGrammarIssue {
  @Field()
  type!: string;

  @Field()
  severity!: string;

  @Field()
  message!: string;

  @Field(() => String, { nullable: true })
  suggestion!: string | null;
}

@ObjectType()
export class GqlGrammarCheckResult {
  @Field()
  language!: string;

  @Field()
  corrected!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  issueCount!: number;

  @Field()
  provider!: string;

  @Field(() => [GqlGrammarIssue])
  issues!: GqlGrammarIssue[];

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleRewriteResult {
  @Field()
  profile!: string;

  @Field()
  rewritten!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  changeCount!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@InputType()
export class AnalyzeLanguageInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => Boolean, { nullable: true })
  includeDialect?: boolean;

  @Field(() => Boolean, { nullable: true })
  includeAccent?: boolean;
}

@ObjectType()
export class GqlLanguageIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlLanguageAnalyzeResult {
  @Field()
  language!: string;

  @Field(() => Float)
  languageConfidence!: number;

  @Field()
  intentLabel!: string;

  @Field()
  sentimentLabel!: string;

  @Field()
  emotionLabel!: string;

  @Field(() => Float)
  readabilityScore!: number;

  @Field(() => Float)
  complexityScore!: number;

  @Field()
  note!: string;
}

@InputType()
export class SearchTmInput {
  @Field()
  text!: string;

  @Field()
  sourceLang!: string;

  @Field()
  targetLang!: string;

  @Field(() => String, { nullable: true })
  projectKey?: string;

  @Field(() => String, { nullable: true })
  mode?: string;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@ObjectType()
export class GqlTmIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlTmSearchHit {
  @Field()
  id!: string;

  @Field()
  scope!: string;

  @Field()
  sourceText!: string;

  @Field()
  targetText!: string;

  @Field(() => Float)
  score!: number;

  @Field(() => Int)
  version!: number;
}

@ObjectType()
export class GqlTmSearchResult {
  @Field()
  provider!: string;

  @Field(() => Int)
  resultCount!: number;

  @Field(() => [GqlTmSearchHit])
  results!: GqlTmSearchHit[];

  @Field()
  note!: string;
}

@ObjectType()
export class GqlLanguageAnalytics {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlAnalyticsOverviewSummary {
  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field(() => Float)
  estimatedCostUsd!: number;

  @Field(() => Float)
  jobErrorRate!: number;

  @Field(() => Int)
  languagePairCount!: number;

  @Field(() => Int)
  featureCount!: number;
}

@ObjectType()
export class GqlEnterpriseAnalyticsReport {
  @Field()
  product!: string;

  @Field()
  generatedAt!: string;

  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field(() => Float)
  estimatedCostUsd!: number;

  @Field(() => Int)
  translationRequests!: number;

  @Field(() => Float, { nullable: true })
  averageQualityScore!: number | null;

  @Field(() => Float, { nullable: true })
  p95LatencyMs!: number | null;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlAfricanIntelligenceCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlAfricanLanguageRegistryEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  coverageComplete!: boolean;
}


@ObjectType()
export class GqlCulturalIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  traditionalKnowledgeConsentRequired!: boolean;
}


@ObjectType()
export class GqlAfricanKnowledgeGraphEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  neo4jOs!: boolean;
}


@ObjectType()
export class GqlGovernmentIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  officialGuidanceMustBeSourced!: boolean;
}


@ObjectType()
export class GqlHealthcareIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  notMedicalAdvice!: boolean;
}


@ObjectType()
export class GqlFinancialIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  notInvestmentAdvice!: boolean;
}


@ObjectType()
export class GqlEducationIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  verticalOperationsOs!: boolean;
}


@ObjectType()
export class GqlAgriculturalIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  verticalOperationsOs!: boolean;
}


@ObjectType()
export class GqlTourismHeritageIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  traditionalKnowledgeConsentRequired!: boolean;
}

@ObjectType()
export class GqlResearchCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlExperimentPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  weightsAndBiasesOs!: boolean;
}


@ObjectType()
export class GqlSyntheticDataPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  syntheticLabelRequired!: boolean;
}


@ObjectType()
export class GqlBenchmarkPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  publicLeaderboardOs!: boolean;
}


@ObjectType()
export class GqlEvaluationPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  regeneratesModelEvaluationPlatform!: boolean;
}


@ObjectType()
export class GqlAiPublicationPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  doiRegistryOs!: boolean;
}


@ObjectType()
export class GqlPatentInnovationPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  usptoOs!: boolean;
}


@ObjectType()
export class GqlOpenSciencePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  traditionalKnowledgeConsentRequired!: boolean;
}


@ObjectType()
export class GqlResearchAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  aiSovereigntyOs!: boolean;
}

@ObjectType()
export class GqlMlopsLlmopsCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlDatasetPipelineEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  regeneratesDatasetMarketplace!: boolean;
}


@ObjectType()
export class GqlTrainingPipelineEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  distributedTrainingOs!: boolean;
}


@ObjectType()
export class GqlContinuousEvaluationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  continuousEvalPass!: boolean;
}


@ObjectType()
export class GqlPromptopsPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  langSmithOs!: boolean;
}


@ObjectType()
export class GqlRagopsPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  vectorDbOs!: boolean;
}


@ObjectType()
export class GqlAgentopsPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  policyViolationsVisible!: boolean;
}


@ObjectType()
export class GqlAiDriftDetectionEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  driftClear!: boolean;
}


@ObjectType()
export class GqlContinuousLearningEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  humanApprovalRequiredBeforePromote!: boolean;
}


@ObjectType()
export class GqlAiOperationsDashboardEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  trustCloudOs!: boolean;
}


@ObjectType()
export class GqlTrustCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlAiSafetyPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  policyRuntimeIntegrated!: boolean;
}


@ObjectType()
export class GqlAiGovernancePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  humanSignOffRequired!: boolean;
}


@ObjectType()
export class GqlExplainabilityPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  shapOs!: boolean;
}


@ObjectType()
export class GqlPrivacyPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  traditionalKnowledgeConsentRequired!: boolean;
}


@ObjectType()
export class GqlCompliancePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  complianceToolingNotCertification!: boolean;
}


@ObjectType()
export class GqlRiskIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  grcSuiteOs!: boolean;
}


@ObjectType()
export class GqlIdentityFederationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  oktaOs!: boolean;
}


@ObjectType()
export class GqlTrustAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  siemOs!: boolean;
}

@ObjectType()
export class GqlPlatformEngineeringCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlInternalDeveloperPortalEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  backstageOs!: boolean;
}


@ObjectType()
export class GqlServiceCatalogEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlGoldenPathPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  scaffoldingOs!: boolean;
}


@ObjectType()
export class GqlGitopsPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  argoCdOs!: boolean;

  @Field(() => Boolean)
  fluxOs!: boolean;
}


@ObjectType()
export class GqlReleaseEngineeringEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  spinnakerOs!: boolean;
}


@ObjectType()
export class GqlReliabilityEngineeringEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  datadogOs!: boolean;
}


@ObjectType()
export class GqlFinopsPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  finopsOs!: boolean;

  @Field(() => Boolean)
  gpuBudgetAlertsEnabled!: boolean;
}


@ObjectType()
export class GqlSupplyChainSecurityEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  snykOs!: boolean;

  @Field(() => Int)
  findingCount!: number;
}


@ObjectType()
export class GqlDeveloperExperiencePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  ideOs!: boolean;
}


@ObjectType()
export class GqlPlatformEngineeringAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  devopsIntelligenceOs!: boolean;
}

@ObjectType()
export class GqlControlPlaneCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlOrganizationControlEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  leastPrivilegeRequired!: boolean;

  @Field(() => Boolean)
  controlPlaneAdminNotDefault!: boolean;
}


@ObjectType()
export class GqlGlobalConfigurationPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  secretsRefsOnly!: boolean;
}


@ObjectType()
export class GqlGlobalPolicyEngineEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  policyRuntimeIntegrated!: boolean;

  @Field(() => Boolean)
  leastPrivilegeRequired!: boolean;
}


@ObjectType()
export class GqlGlobalDeploymentControllerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  productionDeployRequiresAuthorization!: boolean;

  @Field(() => Boolean)
  rollbackPath!: boolean;
}


@ObjectType()
export class GqlGlobalRoutingControllerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  istioOs!: boolean;
}


@ObjectType()
export class GqlSecretsCertificatePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  encryptedAtRest!: boolean;

  @Field(() => Boolean)
  neverLogPlaintextSecrets!: boolean;

  @Field(() => Boolean)
  envelopeEncryptionPattern!: boolean;

  @Field(() => Boolean)
  accessAuditing!: boolean;

  @Field(() => Boolean)
  hashicorpVaultOs!: boolean;

  @Field(() => Int)
  secretCount!: number;
}


@ObjectType()
export class GqlGlobalSchedulerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  executesInference!: boolean;
}


@ObjectType()
export class GqlControlPlaneAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  aggregatesSiblingHubs!: boolean;
}

@ObjectType()
export class GqlDataPlaneCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlTranslationRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlSpeechRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlVoiceRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlVisionRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlKnowledgeRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlEmbeddingRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlDataPlaneStreamingEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}


@ObjectType()
export class GqlGpuRuntimeEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
}

@ObjectType()
export class GqlVaiosProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlAiSchedulerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlRuntimeManagerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlResourceManagerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlWorkflowOperatingSystemEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlAgentOperatingSystemEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlAiMemoryOperatingSystemEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlKnowledgeOperatingSystemEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}


@ObjectType()
export class GqlPluginOperatingSystemEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
}

@ObjectType()
export class GqlEnterpriseEngineeringSystemProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlEngineeringGovernanceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlArchitectureGovernanceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlRepositoryStandardsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlEngineeringQualityPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlAiEngineeringStandardsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlApiEngineeringStandardsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlDatabaseEngineeringStandardsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}


@ObjectType()
export class GqlInfrastructureEngineeringStandardsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}
