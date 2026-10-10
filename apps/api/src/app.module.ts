import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { IdentityModule } from './identity/identity.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { RegistryModule } from './registry/registry.module';
import { LanguagesModule } from './languages/languages.module';
import { GatewayModule } from './gateway/gateway.module';
import { TranslateModule } from './translate/translate.module';
import { UsageModule } from './usage/usage.module';
import { OpenApiModule } from './openapi/openapi.module';
import { AuditModule } from './audit/audit.module';
import { AuditCoreModule } from './audit/audit-core.module';
import { BillingModule } from './billing/billing.module';
import { JobsModule } from './jobs/jobs.module';
import { DocumentsModule } from './documents/documents.module';
import { AudioModule } from './audio/audio.module';
import { OcrModule } from './ocr/ocr.module';
import { GlossaryModule } from './glossary/glossary.module';
import { TmModule } from './tm/tm.module';
import { QualityModule } from './quality/quality.module';
import { LocalizeModule } from './localize/localize.module';
import { ChatModule } from './chat/chat.module';
import { InterpretModule } from './interpret/interpret.module';
import { DealBridgeModule } from './dealbridge/dealbridge.module';
import { AccessLineModule } from './accessline/accessline.module';
import { VoiceBridgeModule } from './voicebridge/voicebridge.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ObservabilityModule } from './observability/observability.module';
import { GovernanceModule } from './governance/governance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { VoiceModule } from './voice/voice.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PromptsModule } from './prompts/prompts.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EvalModule } from './eval/eval.module';
import { DatasetsModule } from './datasets/datasets.module';
import { LocalesModule } from './locales/locales.module';
import { VerticalGlossariesModule } from './vertical-glossaries/vertical-glossaries.module';
import { FineTunesModule } from './finetunes/finetunes.module';
import { ModelsModule } from './models/models.module';
import { TrainingModule } from './training/training.module';
import { VoiceClonesModule } from './voice-clones/voice-clones.module';
import { RegionsModule } from './regions/regions.module';
import { ResidencyModule } from './residency/residency.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { CloudFoundationModule } from './cloud-foundation/cloud-foundation.module';
import { DeveloperCloudModule } from './developer-cloud/developer-cloud.module';
import { EnterpriseCloudModule } from './enterprise-cloud/enterprise-cloud.module';
import { GatewayCloudModule } from './gateway-cloud/gateway-cloud.module';
import { LanguageCloudModule } from './language-cloud/language-cloud.module';
import { SpeechCloudModule } from './speech-cloud/speech-cloud.module';
import { VoiceCloudModule } from './voice-cloud/voice-cloud.module';
import { IntelligenceCloudModule } from './intelligence-cloud/intelligence-cloud.module';
import { KnowledgeCloudModule } from './knowledge-cloud/knowledge-cloud.module';
import { InferenceCloudModule } from './inference-cloud/inference-cloud.module';
import { GpuPlatformModule } from './gpu-platform/gpu-platform.module';
import { ModelServingModule } from './model-serving/model-serving.module';
import { AiRouterModule } from './ai-router/ai-router.module';
import { StreamingRuntimeModule } from './streaming-runtime/streaming-runtime.module';
import { BatchRuntimeModule } from './batch-runtime/batch-runtime.module';
import { IntelligentCacheModule } from './intelligent-cache/intelligent-cache.module';
import { CostOptimizationModule } from './cost-optimization/cost-optimization.module';
import { AiRuntimeAnalyticsModule } from './ai-runtime-analytics/ai-runtime-analytics.module';
import { AiKernelModule } from './ai-kernel/ai-kernel.module';
import { FoundationModelCloudModule } from './foundation-model-cloud/foundation-model-cloud.module';
import { ModelTrainingPlatformModule } from './model-training-platform/model-training-platform.module';
import { ModelEvaluationPlatformModule } from './model-evaluation-platform/model-evaluation-platform.module';
import { ModelRegistryModule } from './model-registry/model-registry.module';
import { AtlasModule } from './atlas/atlas.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { MixModule } from './mix/mix.module';
import { McpModule } from './mcp/mcp.module';
import { FidelityModule } from './fidelity/fidelity.module';
import { LiveModule } from './live/live.module';
import { PragmaticsModule } from './pragmatics/pragmatics.module';
import { LanguageKitsModule } from './language-kits/language-kits.module';
import { EdgeModule } from './edge-packs/edge.module';
import { GroundedModule } from './grounded/grounded.module';
import { DataAdvantageModule } from './data-advantage/data-advantage.module';
import { CorridorBenchmarksModule } from './corridor-benchmarks/corridor-benchmarks.module';
import { AiFabricModule } from './ai-fabric/ai-fabric.module';
import { EventFabricModule } from './event-fabric/event-fabric.module';
import { ContextFabricModule } from './context-fabric/context-fabric.module';
import { KnowledgeFabricModule } from './knowledge-fabric/knowledge-fabric.module';
import { PromptFabricModule } from './prompt-fabric/prompt-fabric.module';
import { ReasoningFabricModule } from './reasoning-fabric/reasoning-fabric.module';
import { MemoryFabricModule } from './memory-fabric/memory-fabric.module';
import { AgentFabricModule } from './agent-fabric/agent-fabric.module';
import { PolicyFabricModule } from './policy-fabric/policy-fabric.module';
import { EcosystemCloudModule } from './ecosystem-cloud/ecosystem-cloud.module';
import { PluginMarketplaceModule } from './plugin-marketplace/plugin-marketplace.module';
import { ModelMarketplaceModule } from './model-marketplace/model-marketplace.module';
import { DatasetMarketplaceModule } from './dataset-marketplace/dataset-marketplace.module';
import { PromptMarketplaceModule } from './prompt-marketplace/prompt-marketplace.module';
import { AgentMarketplaceModule } from './agent-marketplace/agent-marketplace.module';
import { WorkflowMarketplaceModule } from './workflow-marketplace/workflow-marketplace.module';
import { ConnectorMarketplaceModule } from './connector-marketplace/connector-marketplace.module';
import { VoiceLanguageMarketplaceModule } from './voice-language-marketplace/voice-language-marketplace.module';
import { CreatorEconomyModule } from './creator-economy/creator-economy.module';
import { TourismHeritageIntelligenceModule } from './tourism-heritage-intelligence/tourism-heritage-intelligence.module';
import { ResearchAnalyticsModule } from './research-analytics/research-analytics.module';
import { AiOperationsDashboardModule } from './ai-operations-dashboard/ai-operations-dashboard.module';
import { ContinuousLearningModule } from './continuous-learning/continuous-learning.module';
import { AiDriftDetectionModule } from './ai-drift-detection/ai-drift-detection.module';
import { AgentopsPlatformModule } from './agentops-platform/agentops-platform.module';
import { RagopsPlatformModule } from './ragops-platform/ragops-platform.module';
import { PromptopsPlatformModule } from './promptops-platform/promptops-platform.module';
import { ContinuousEvaluationModule } from './continuous-evaluation/continuous-evaluation.module';
import { TrainingPipelineModule } from './training-pipeline/training-pipeline.module';
import { DatasetPipelineModule } from './dataset-pipeline/dataset-pipeline.module';
import { MlopsLlmopsCloudModule } from './mlops-llmops-cloud/mlops-llmops-cloud.module';
import { TrustCloudModule } from './trust-cloud/trust-cloud.module';
import { AiSafetyPlatformModule } from './ai-safety-platform/ai-safety-platform.module';
import { AiGovernancePlatformModule } from './ai-governance-platform/ai-governance-platform.module';
import { ExplainabilityPlatformModule } from './explainability-platform/explainability-platform.module';
import { PrivacyPlatformModule } from './privacy-platform/privacy-platform.module';
import { CompliancePlatformModule } from './compliance-platform/compliance-platform.module';
import { RiskIntelligenceModule } from './risk-intelligence/risk-intelligence.module';
import { IdentityFederationModule } from './identity-federation/identity-federation.module';
import { TrustAnalyticsModule } from './trust-analytics/trust-analytics.module';
import { PlatformEngineeringCloudModule } from './platform-engineering-cloud/platform-engineering-cloud.module';
import { InternalDeveloperPortalModule } from './internal-developer-portal/internal-developer-portal.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';
import { GoldenPathPlatformModule } from './golden-path-platform/golden-path-platform.module';
import { GitopsPlatformModule } from './gitops-platform/gitops-platform.module';
import { ReleaseEngineeringModule } from './release-engineering/release-engineering.module';
import { ReliabilityEngineeringModule } from './reliability-engineering/reliability-engineering.module';
import { FinopsPlatformModule } from './finops-platform/finops-platform.module';
import { SupplyChainSecurityModule } from './supply-chain-security/supply-chain-security.module';
import { DeveloperExperiencePlatformModule } from './developer-experience-platform/developer-experience-platform.module';
import { PlatformEngineeringAnalyticsModule } from './platform-engineering-analytics/platform-engineering-analytics.module';
import { ControlPlaneCloudModule } from './control-plane-cloud/control-plane-cloud.module';
import { OrganizationControlModule } from './organization-control/organization-control.module';
import { GlobalConfigurationPlatformModule } from './global-configuration-platform/global-configuration-platform.module';
import { GlobalPolicyEngineModule } from './global-policy-engine/global-policy-engine.module';
import { GlobalDeploymentControllerModule } from './global-deployment-controller/global-deployment-controller.module';
import { GlobalRoutingControllerModule } from './global-routing-controller/global-routing-controller.module';
import { SecretsCertificatePlatformModule } from './secrets-certificate-platform/secrets-certificate-platform.module';
import { GlobalSchedulerModule } from './global-scheduler/global-scheduler.module';
import { ControlPlaneAnalyticsModule } from './control-plane-analytics/control-plane-analytics.module';
import { DataPlaneCloudModule } from './data-plane-cloud/data-plane-cloud.module';
import { TranslationRuntimeModule } from './translation-runtime/translation-runtime.module';
import { SpeechRuntimeModule } from './speech-runtime/speech-runtime.module';
import { VoiceRuntimeModule } from './voice-runtime/voice-runtime.module';
import { VisionRuntimeModule } from './vision-runtime/vision-runtime.module';
import { KnowledgeRuntimeModule } from './knowledge-runtime/knowledge-runtime.module';
import { EmbeddingRuntimeModule } from './embedding-runtime/embedding-runtime.module';
import { DataPlaneStreamingModule } from './data-plane-streaming/data-plane-streaming.module';
import { GpuRuntimeModule } from './gpu-runtime/gpu-runtime.module';
import { VaiosModule } from './vaios/vaios.module';
import { AiSchedulerModule } from './ai-scheduler/ai-scheduler.module';
import { RuntimeManagerModule } from './runtime-manager/runtime-manager.module';
import { ResourceManagerModule } from './resource-manager/resource-manager.module';
import { WorkflowOperatingSystemModule } from './workflow-operating-system/workflow-operating-system.module';
import { AgentOperatingSystemModule } from './agent-operating-system/agent-operating-system.module';
import { AiMemoryOperatingSystemModule } from './ai-memory-operating-system/ai-memory-operating-system.module';
import { KnowledgeOperatingSystemModule } from './knowledge-operating-system/knowledge-operating-system.module';
import { PluginOperatingSystemModule } from './plugin-operating-system/plugin-operating-system.module';
import { EnterpriseEngineeringSystemModule } from './enterprise-engineering-system/enterprise-engineering-system.module';
import { EngineeringGovernanceModule } from './engineering-governance/engineering-governance.module';
import { ArchitectureGovernanceModule } from './architecture-governance/architecture-governance.module';
import { RepositoryStandardsModule } from './repository-standards/repository-standards.module';
import { EngineeringQualityPlatformModule } from './engineering-quality-platform/engineering-quality-platform.module';
import { AiEngineeringStandardsModule } from './ai-engineering-standards/ai-engineering-standards.module';
import { ApiEngineeringStandardsModule } from './api-engineering-standards/api-engineering-standards.module';
import { DatabaseEngineeringStandardsModule } from './database-engineering-standards/database-engineering-standards.module';
import { InfrastructureEngineeringStandardsModule } from './infrastructure-engineering-standards/infrastructure-engineering-standards.module';
import { OpenSciencePlatformModule } from './open-science-platform/open-science-platform.module';
import { PatentInnovationPlatformModule } from './patent-innovation-platform/patent-innovation-platform.module';
import { AiPublicationPlatformModule } from './ai-publication-platform/ai-publication-platform.module';
import { EvaluationPlatformModule } from './evaluation-platform/evaluation-platform.module';
import { BenchmarkPlatformModule } from './benchmark-platform/benchmark-platform.module';
import { SyntheticDataPlatformModule } from './synthetic-data-platform/synthetic-data-platform.module';
import { ExperimentPlatformModule } from './experiment-platform/experiment-platform.module';
import { ResearchCloudModule } from './research-cloud/research-cloud.module';
import { AgriculturalIntelligenceModule } from './agricultural-intelligence/agricultural-intelligence.module';
import { EducationIntelligenceModule } from './education-intelligence/education-intelligence.module';
import { FinancialIntelligenceModule } from './financial-intelligence/financial-intelligence.module';
import { HealthcareIntelligenceModule } from './healthcare-intelligence/healthcare-intelligence.module';
import { GovernmentIntelligenceModule } from './government-intelligence/government-intelligence.module';
import { LanguageIntegrityModule } from './language-integrity/language-integrity.module';
import { AfricanKnowledgeGraphModule } from './african-knowledge-graph/african-knowledge-graph.module';
import { CulturalIntelligenceModule } from './cultural-intelligence/cultural-intelligence.module';
import { AfricanLanguageRegistryModule } from './african-language-registry/african-language-registry.module';
import { RegionalLanguageRegistryModule } from './regional-language-registry/regional-language-registry.module';
import { AfricanIntelligenceCloudModule } from './african-intelligence-cloud/african-intelligence-cloud.module';
import { MemoryRuntimeModule } from './memory-runtime/memory-runtime.module';
import { PromptRuntimeModule } from './prompt-runtime/prompt-runtime.module';
import { ContextRuntimeModule } from './context-runtime/context-runtime.module';
import { ReasoningRuntimeModule } from './reasoning-runtime/reasoning-runtime.module';
import { AgentRuntimeModule } from './agent-runtime/agent-runtime.module';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';
import { PluginRuntimeModule } from './plugin-runtime/plugin-runtime.module';
import { PolicyRuntimeModule } from './policy-runtime/policy-runtime.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { EnterpriseSearchModule } from './enterprise-search/enterprise-search.module';
import { OntologyPlatformModule } from './ontology-platform/ontology-platform.module';
import { TaxonomyPlatformModule } from './taxonomy-platform/taxonomy-platform.module';
import { EnterpriseRagModule } from './enterprise-rag/enterprise-rag.module';
import { KnowledgeMemoryModule } from './knowledge-memory/knowledge-memory.module';
import { KnowledgeIntelligenceModule } from './knowledge-intelligence/knowledge-intelligence.module';
import { KnowledgeApisModule } from './knowledge-apis/knowledge-apis.module';
import { KnowledgeAnalyticsModule } from './knowledge-analytics/knowledge-analytics.module';
import { EmbeddingCloudModule } from './embedding-cloud/embedding-cloud.module';
import { VectorCloudModule } from './vector-cloud/vector-cloud.module';
import { MemoryCloudModule } from './memory-cloud/memory-cloud.module';
import { KnowledgeGraphModule } from './knowledge-graph/knowledge-graph.module';
import { ContextEngineModule } from './context-engine/context-engine.module';
import { ReasoningCloudModule } from './reasoning-cloud/reasoning-cloud.module';
import { RecommendationEngineModule } from './recommendation-engine/recommendation-engine.module';
import { PromptIntelligenceModule } from './prompt-intelligence/prompt-intelligence.module';
import { DecisionEngineModule } from './decision-engine/decision-engine.module';
import { AiOrchestrationModule } from './ai-orchestration/ai-orchestration.module';
import { IntelligenceAnalyticsModule } from './intelligence-analytics/intelligence-analytics.module';
import { NeuralTtsModule } from './neural-tts/neural-tts.module';
import { VoiceCloningModule } from './voice-cloning/voice-cloning.module';
import { EmotionVoiceModule } from './emotion-voice/emotion-voice.module';
import { VoiceStudioModule } from './voice-studio/voice-studio.module';
import { VoiceEnhancementModule } from './voice-enhancement/voice-enhancement.module';
import { VoiceBiometricsModule } from './voice-biometrics/voice-biometrics.module';
import { VoiceMarketplaceModule } from './voice-marketplace/voice-marketplace.module';
import { VoiceAnalyticsModule } from './voice-analytics/voice-analytics.module';
import { SpeechRecognitionModule } from './speech-recognition/speech-recognition.module';
import { SpeakerIntelligenceModule } from './speaker-intelligence/speaker-intelligence.module';
import { EmotionIntelligenceModule } from './emotion-intelligence/emotion-intelligence.module';
import { AudioIntelligenceModule } from './audio-intelligence/audio-intelligence.module';
import { PronunciationIntelligenceModule } from './pronunciation-intelligence/pronunciation-intelligence.module';
import { WakeWordModule } from './wake-word/wake-word.module';
import { CallIntelligenceModule } from './call-intelligence/call-intelligence.module';
import { SpeechAnalyticsModule } from './speech-analytics/speech-analytics.module';
import { DialectsModule } from './dialects/dialects.module';
import { AccentsModule } from './accents/accents.module';
import { DemoSpeechModule } from './demo-speech/demo-speech.module';
import { SpeechReviewModule } from './speech-review/speech-review.module';
import { VoiceDataModule } from './voice-data/voice-data.module';
import { PilotRequestsModule } from './pilot-requests/pilot-requests.module';
import { GrammarModule } from './grammar/grammar.module';
import { StyleModule } from './style/style.module';
import { LanguageIntelligenceModule } from './language-intelligence/language-intelligence.module';
import { CountryPacksModule } from './country-packs/country-packs.module';
import { GraphqlModule } from './graphql/graphql.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ObservabilityModule,
    AuditCoreModule,
    NotificationsModule,
    IdentityModule,
    WorkspacesModule,
    CloudFoundationModule,
    DeveloperCloudModule,
    EnterpriseCloudModule,
    GatewayCloudModule,
    LanguageCloudModule,
    SpeechCloudModule,
    VoiceCloudModule,
    IntelligenceCloudModule,
    KnowledgeCloudModule,
    InferenceCloudModule,
    GpuPlatformModule,
    ModelServingModule,
    AiRouterModule,
    StreamingRuntimeModule,
    BatchRuntimeModule,
    IntelligentCacheModule,
    CostOptimizationModule,
    AiRuntimeAnalyticsModule,
    AiKernelModule,
    FoundationModelCloudModule,
    ModelTrainingPlatformModule,
    ModelEvaluationPlatformModule,
    ModelRegistryModule,
    AtlasModule,
    PortfolioModule,
    MixModule,
    McpModule,
    FidelityModule,
    LiveModule,
    PragmaticsModule,
    LanguageKitsModule,
    EdgeModule,
    GroundedModule,
    DataAdvantageModule,
    CorridorBenchmarksModule,
    AiFabricModule,
    EventFabricModule,
    ContextFabricModule,
    KnowledgeFabricModule,
    PromptFabricModule,
    ReasoningFabricModule,
    MemoryFabricModule,
    AgentFabricModule,
    PolicyFabricModule,
    EcosystemCloudModule,
    PluginMarketplaceModule,
    ModelMarketplaceModule,
    DatasetMarketplaceModule,
    PromptMarketplaceModule,
    AgentMarketplaceModule,
    WorkflowMarketplaceModule,
    ConnectorMarketplaceModule,
    VoiceLanguageMarketplaceModule,
    CreatorEconomyModule,
    TourismHeritageIntelligenceModule,
    ResearchAnalyticsModule,
    AiOperationsDashboardModule,
    ContinuousLearningModule,
    AiDriftDetectionModule,
    AgentopsPlatformModule,
    RagopsPlatformModule,
    PromptopsPlatformModule,
    ContinuousEvaluationModule,
    TrainingPipelineModule,
    DatasetPipelineModule,
    MlopsLlmopsCloudModule,
    TrustCloudModule,
    AiSafetyPlatformModule,
    AiGovernancePlatformModule,
    ExplainabilityPlatformModule,
    PrivacyPlatformModule,
    CompliancePlatformModule,
    RiskIntelligenceModule,
    IdentityFederationModule,
    TrustAnalyticsModule,
    PlatformEngineeringCloudModule,
    InternalDeveloperPortalModule,
    ServiceCatalogModule,
    GoldenPathPlatformModule,
    GitopsPlatformModule,
    ReleaseEngineeringModule,
    ReliabilityEngineeringModule,
    FinopsPlatformModule,
    SupplyChainSecurityModule,
    DeveloperExperiencePlatformModule,
    PlatformEngineeringAnalyticsModule,
    ControlPlaneCloudModule,
    OrganizationControlModule,
    GlobalConfigurationPlatformModule,
    GlobalPolicyEngineModule,
    GlobalDeploymentControllerModule,
    GlobalRoutingControllerModule,
    SecretsCertificatePlatformModule,
    GlobalSchedulerModule,
    ControlPlaneAnalyticsModule,
    DataPlaneCloudModule,
    TranslationRuntimeModule,
    SpeechRuntimeModule,
    VoiceRuntimeModule,
    VisionRuntimeModule,
    KnowledgeRuntimeModule,
    EmbeddingRuntimeModule,
    DataPlaneStreamingModule,
    GpuRuntimeModule,
    VaiosModule,
    AiSchedulerModule,
    RuntimeManagerModule,
    ResourceManagerModule,
    WorkflowOperatingSystemModule,
    AgentOperatingSystemModule,
    AiMemoryOperatingSystemModule,
    KnowledgeOperatingSystemModule,
    PluginOperatingSystemModule,
    EnterpriseEngineeringSystemModule,
    EngineeringGovernanceModule,
    ArchitectureGovernanceModule,
    RepositoryStandardsModule,
    EngineeringQualityPlatformModule,
    AiEngineeringStandardsModule,
    ApiEngineeringStandardsModule,
    DatabaseEngineeringStandardsModule,
    InfrastructureEngineeringStandardsModule,
    OpenSciencePlatformModule,
    PatentInnovationPlatformModule,
    AiPublicationPlatformModule,
    EvaluationPlatformModule,
    BenchmarkPlatformModule,
    SyntheticDataPlatformModule,
    ExperimentPlatformModule,
    ResearchCloudModule,
    AgriculturalIntelligenceModule,
    EducationIntelligenceModule,
    FinancialIntelligenceModule,
    HealthcareIntelligenceModule,
    GovernmentIntelligenceModule,
    LanguageIntegrityModule,
    AfricanKnowledgeGraphModule,
    CulturalIntelligenceModule,
    AfricanLanguageRegistryModule,
    RegionalLanguageRegistryModule,
    AfricanIntelligenceCloudModule,
    MemoryRuntimeModule,
    PromptRuntimeModule,
    ContextRuntimeModule,
    ReasoningRuntimeModule,
    AgentRuntimeModule,
    WorkflowRuntimeModule,
    PluginRuntimeModule,
    PolicyRuntimeModule,
    KnowledgeBaseModule,
    EnterpriseSearchModule,
    OntologyPlatformModule,
    TaxonomyPlatformModule,
    EnterpriseRagModule,
    KnowledgeMemoryModule,
    KnowledgeIntelligenceModule,
    KnowledgeApisModule,
    KnowledgeAnalyticsModule,
    EmbeddingCloudModule,
    VectorCloudModule,
    MemoryCloudModule,
    KnowledgeGraphModule,
    ContextEngineModule,
    ReasoningCloudModule,
    RecommendationEngineModule,
    PromptIntelligenceModule,
    DecisionEngineModule,
    AiOrchestrationModule,
    IntelligenceAnalyticsModule,
    NeuralTtsModule,
    VoiceCloningModule,
    EmotionVoiceModule,
    VoiceStudioModule,
    VoiceEnhancementModule,
    VoiceBiometricsModule,
    VoiceMarketplaceModule,
    VoiceAnalyticsModule,
    SpeechRecognitionModule,
    SpeakerIntelligenceModule,
    EmotionIntelligenceModule,
    AudioIntelligenceModule,
    PronunciationIntelligenceModule,
    WakeWordModule,
    CallIntelligenceModule,
    SpeechAnalyticsModule,
    ApiKeysModule,
    RegistryModule,
    LanguagesModule,
    DialectsModule,
    AccentsModule,
    DemoSpeechModule,
    SpeechReviewModule,
    VoiceDataModule,
    PilotRequestsModule,
    GrammarModule,
    StyleModule,
    LanguageIntelligenceModule,
    CountryPacksModule,
    GraphqlModule,
    LocalesModule,
    GatewayModule,
    TranslateModule,
    UsageModule,
    OpenApiModule,
    AuditModule,
    BillingModule,
    JobsModule,
    DocumentsModule,
    AudioModule,
    OcrModule,
    GlossaryModule,
    TmModule,
    QualityModule,
    LocalizeModule,
    PromptsModule,
    ChatModule,
    InterpretModule,
    DealBridgeModule,
    AccessLineModule,
    VoiceBridgeModule,
    EmbeddingsModule,
    KnowledgeModule,
    GovernanceModule,
    AdminModule,
    ConnectorsModule,
    WorkflowsModule,
    VoiceModule,
    AnalyticsModule,
    MarketplaceModule,
    EvalModule,
    DatasetsModule,
    VerticalGlossariesModule,
    FineTunesModule,
    ModelsModule,
    TrainingModule,
    VoiceClonesModule,
    RegionsModule,
    ResidencyModule,
    OnboardingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
