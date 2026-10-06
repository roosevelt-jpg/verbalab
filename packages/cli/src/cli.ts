#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { VerbaLab } from '@verbalab/sdk';

function usage(): never {
  console.error(`Usage:
  verbalab translate --text <text> --target <lang> [--source <lang>]
  verbalab translate-format --format <html|markdown|xml|csv|srt> --file <path> --target <lang> [--source <lang>]
  verbalab translate-engine
  verbalab localize --format <json|yaml> --file <path> --target <lang> [--source <lang>]
  verbalab localize-qa --source-file <path> --target-file <path> [--format json|yaml]
  verbalab locales
  verbalab localization
  verbalab icu-validate --message <icu>
  verbalab languages
  verbalab speech-products
  verbalab voice-products
  verbalab intelligence-products
  verbalab knowledge-products
  verbalab inference-products
  verbalab ai-kernel-products
  verbalab foundation-model-cloud-products
  verbalab model-training-platform-engine
  verbalab model-evaluation-platform-engine
  verbalab model-registry-engine
  verbalab atlas-engine
  verbalab ai-fabric-products
  verbalab event-fabric-products
  verbalab event-fabric-publish --topic <topic> --type <type> [--data <json>]
  verbalab event-fabric-poll [--topic <topic>] [--count <n>]
  verbalab context-fabric-products
  verbalab context-fabric-route [--kind <kind>]...
  verbalab knowledge-fabric-products
  verbalab knowledge-fabric-route [--kind <kind>]...
  verbalab knowledge-fabric-federate [--kind <kind>]...
  verbalab prompt-fabric-products
  verbalab prompt-fabric-route [--feature <feature>] [--kind <kind>]...
  verbalab reasoning-fabric-products
  verbalab reasoning-fabric-route [--kind <kind>]...
  verbalab reasoning-fabric-pipeline [--id <pipelineId>]
  verbalab memory-fabric-products
  verbalab memory-fabric-route [--kind <kind>]...
  verbalab memory-fabric-pipeline [--id <pipelineId>]
  verbalab agent-fabric-products
  verbalab agent-fabric-route [--kind <kind>]...
  verbalab agent-fabric-pipeline [--id <pipelineId>]
  verbalab policy-fabric-products
  verbalab policy-fabric-route [--kind <kind>]...
  verbalab policy-fabric-pipeline [--id <pipelineId>]
  verbalab ecosystem-cloud-products
  verbalab plugin-marketplace-engine
  verbalab model-marketplace-engine
  verbalab dataset-marketplace-engine
  verbalab prompt-marketplace-engine
  verbalab agent-marketplace-engine
  verbalab workflow-marketplace-engine
  verbalab connector-marketplace-engine
  verbalab voice-language-marketplace-engine
  verbalab creator-economy-engine
  verbalab african-intelligence-cloud-products
  verbalab african-language-registry-engine
  verbalab cultural-intelligence-engine
  verbalab african-knowledge-graph-engine
  verbalab government-intelligence-engine
  verbalab healthcare-intelligence-engine
  verbalab financial-intelligence-engine
  verbalab education-intelligence-engine
  verbalab agricultural-intelligence-engine
  verbalab tourism-heritage-intelligence-engine
  verbalab research-cloud-products
  verbalab mlops-llmops-cloud-products
  verbalab dataset-pipeline-engine
  verbalab training-pipeline-engine
  verbalab continuous-evaluation-engine
  verbalab promptops-platform-engine
  verbalab ragops-platform-engine
  verbalab agentops-platform-engine
  verbalab ai-drift-detection-engine
  verbalab continuous-learning-engine
  verbalab ai-operations-dashboard-engine
  verbalab trust-cloud-products
  verbalab ai-safety-platform-engine
  verbalab ai-governance-platform-engine
  verbalab explainability-platform-engine
  verbalab privacy-platform-engine
  verbalab compliance-platform-engine
  verbalab risk-intelligence-engine
  verbalab identity-federation-engine
  verbalab trust-analytics-engine
  verbalab platform-engineering-cloud-products
  verbalab internal-developer-portal-engine
  verbalab service-catalog-engine
  verbalab golden-path-platform-engine
  verbalab gitops-platform-engine
  verbalab release-engineering-engine
  verbalab reliability-engineering-engine
  verbalab finops-platform-engine
  verbalab supply-chain-security-engine
  verbalab developer-experience-platform-engine
  verbalab platform-engineering-analytics-engine
  verbalab control-plane-cloud-products
  verbalab organization-control-engine
  verbalab global-configuration-platform-engine
  verbalab global-policy-engine-engine
  verbalab global-deployment-controller-engine
  verbalab global-routing-controller-engine
  verbalab secrets-certificate-platform-engine
  verbalab global-scheduler-engine
  verbalab control-plane-analytics-engine
  verbalab data-plane-cloud-products
  verbalab translation-runtime-engine
  verbalab speech-runtime-engine
  verbalab voice-runtime-engine
  verbalab vision-runtime-engine
  verbalab knowledge-runtime-engine
  verbalab embedding-runtime-engine
  verbalab data-plane-streaming-engine
  verbalab gpu-runtime-engine
  verbalab vaios-products
  verbalab ai-scheduler-engine
  verbalab runtime-manager-engine
  verbalab resource-manager-engine
  verbalab workflow-operating-system-engine
  verbalab agent-operating-system-engine
  verbalab ai-memory-operating-system-engine
  verbalab knowledge-operating-system-engine
  verbalab plugin-operating-system-engine
  verbalab enterprise-engineering-system-products
  verbalab engineering-governance-engine
  verbalab architecture-governance-engine
  verbalab repository-standards-engine
  verbalab engineering-quality-platform-engine
  verbalab ai-engineering-standards-engine
  verbalab api-engineering-standards-engine
  verbalab database-engineering-standards-engine
  verbalab infrastructure-engineering-standards-engine
  verbalab ai-engineering-standards-checks
  verbalab experiment-platform-engine
  verbalab synthetic-data-platform-engine
  verbalab benchmark-platform-engine
  verbalab evaluation-platform-engine
  verbalab ai-publication-platform-engine
  verbalab patent-innovation-platform-engine
  verbalab open-science-platform-engine
  verbalab research-analytics-engine
  verbalab memory-runtime-engine
  verbalab memory-runtime-put --content <text> [--scope workspace] [--kind short_term]
  verbalab prompt-runtime-engine
  verbalab prompt-runtime-execute [--key chat|rag|voice_faq] [--feature <name>] [--var k=v]
  verbalab context-runtime-engine
  verbalab context-runtime-assemble [--query <text>] [--model <hint>] [--max-chars <n>]
  verbalab reasoning-runtime-engine
  verbalab reasoning-runtime-plan --problem <text> [--sandbox]
  verbalab agent-runtime-engine
  verbalab agent-runtime-create --name <name> [--permission <id>]... [--goal <text>]
  verbalab agent-runtime-run --agent <id> [--goal <text>] [--action <permission>]
  verbalab workflow-runtime-engine
  verbalab workflow-runtime-create --name <name> [--permission <id>]... [--mode sequential|parallel]
  verbalab workflow-runtime-run --workflow <id> [--approved]
  verbalab plugin-runtime-engine
  verbalab plugin-runtime-register --name <name> [--permission <id>]...
  verbalab plugin-runtime-invoke --plugin <id> [--action <permission>]
  verbalab policy-runtime-engine
  verbalab policy-runtime-evaluate --action <action> [--runtime agent-runtime|workflow-runtime|plugin-runtime]
  verbalab policy-runtime-create --name <name> --action <action> [--kind security] [--effect deny]
  verbalab gpu-platform-engine
  verbalab gpu-platform-pools [--vendor nvidia|amd|intel]
  verbalab gpu-platform-allocate --pool <id> [--instances <n>]
  verbalab model-serving-engine
  verbalab model-serving-kinds
  verbalab model-serving-endpoints [--kind llm|speech|voice|ocr|embedding|reasoning]
  verbalab model-serving-deploy --kind <kind> --model <slug> [--version <v>] [--strategy rolling|canary|blue_green]
  verbalab ai-router-engine
  verbalab ai-router-resolve [--feature chat|translate|stt|tts|ocr|embeddings|detect] [--optimize latency|cost|balanced|quality]
  verbalab streaming-runtime-engine
  verbalab streaming-runtime-surfaces [--kind speech|voice|translation|llm|video|realtime]
  verbalab batch-runtime-engine
  verbalab batch-runtime-run --kind <kind> --item <text> [--priority low|normal|high]
  verbalab intelligent-cache-engine
  verbalab intelligent-cache-put --namespace <ns> --key <key> [--value <json>]
  verbalab intelligent-cache-lookup --namespace <ns> --key <key>
  verbalab cost-optimization-engine
  verbalab cost-optimization-record --category <cat> --amount <usd>
  verbalab cost-optimization-optimize [--feature chat|translate|stt|tts|ocr|embeddings|detect]
  verbalab ai-runtime-analytics-engine
  verbalab ai-runtime-analytics-overview
  verbalab ai-runtime-analytics-report
  verbalab knowledge-base-engine
  verbalab enterprise-search-engine
  verbalab enterprise-search --query <text> [--mode keyword|semantic|hybrid]
  verbalab ontology-engine
  verbalab taxonomy-engine
  verbalab enterprise-rag-engine
  verbalab enterprise-rag-retrieve --query <text> [--mode keyword|semantic|hybrid]
  verbalab enterprise-rag-query --question <text> [--mode keyword|semantic|hybrid]
  verbalab knowledge-memory-engine
  verbalab knowledge-intelligence-engine
  verbalab knowledge-intelligence-discover --query <text>
  verbalab knowledge-apis-engine
  verbalab knowledge-apis-surfaces
  verbalab embedding-cloud-engine
  verbalab embedding-cloud-models
  verbalab vector-cloud-engine
  verbalab vector-cloud-search --query <text> [--k <n>]
  verbalab memory-cloud-engine
  verbalab memory-cloud-export [--subject <userId>]
  verbalab knowledge-graph-engine
  verbalab context-engine
  verbalab context-assemble [--query <text>] [--max-chars <n>]
  verbalab reasoning-cloud-engine
  verbalab reasoning-cloud-reason --problem <text> [--strategy <id>]
  verbalab recommendation-engine
  verbalab recommend --kind <language|voice|content|...> [--query <text>]
  verbalab prompt-intelligence
  verbalab prompt-intelligence-preview --key <chat|rag|voice_faq> [--body <text>]
  verbalab prompt-intelligence-evaluate --key <chat|rag|voice_faq> [--body <text>]
  verbalab decision-engine
  verbalab decide --kind <routing|policy|model_selection|...> [--query <text>]
  verbalab ai-orchestration
  verbalab ai-orchestration-run --pipeline <detect_translate|...> --text <text> [--target <lang>]
  verbalab intelligence-analytics
  verbalab intelligence-analytics-overview
  verbalab intelligence-analytics-report
  verbalab knowledge-analytics
  verbalab knowledge-analytics-overview
  verbalab knowledge-analytics-report
  verbalab neural-tts-engine
  verbalab neural-tts-voices
  verbalab voice-cloning-engine
  verbalab voice-cloning-consent
  verbalab emotion-voice-engine
  verbalab emotion-voice-profiles
  verbalab voice-studio-engine
  verbalab voice-studio-library
  verbalab voice-enhancement-engine
  verbalab voice-enhancement-profiles
  verbalab voice-biometrics-engine
  verbalab voice-biometrics-encryption
  verbalab voice-marketplace-engine
  verbalab voice-marketplace-language-packs
  verbalab voice-analytics
  verbalab speech-engine
  verbalab speaker-engine
  verbalab accent-engine
  verbalab emotion-engine
  verbalab audio-engine
  verbalab pronunciation-engine
  verbalab wake-word-engine
  verbalab call-engine
  verbalab speech-analytics
  verbalab whoami

Env:
  VERBALAB_API_KEY   vl_live_… or vl_test_… (required)
  VERBALAB_API_URL   API base (default https://api.verbalab.ai)
`);
  process.exit(1);
}

function argValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function client() {
  const apiKey = process.env.VERBALAB_API_KEY?.trim();
  if (!apiKey) {
    console.error('Set VERBALAB_API_KEY to a vl_live_ or vl_test_ key');
    process.exit(1);
  }
  return new VerbaLab({
    apiKey,
    baseUrl: process.env.VERBALAB_API_URL?.trim() || undefined,
  });
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === '-h' || command === '--help') usage();

  const vl = client();

  if (command === 'languages') {
    console.log(JSON.stringify(await vl.languages(), null, 2));
    return;
  }

  if (command === 'speech-products') {
    console.log(JSON.stringify(await vl.speechProducts(), null, 2));
    return;
  }

  if (command === 'voice-products') {
    console.log(JSON.stringify(await vl.voiceProducts(), null, 2));
    return;
  }

  if (command === 'intelligence-products') {
    console.log(JSON.stringify(await vl.intelligenceProducts(), null, 2));
    return;
  }

  if (command === 'knowledge-products') {
    console.log(JSON.stringify(await vl.knowledgeProducts(), null, 2));
    return;
  }

  if (command === 'inference-products') {
    console.log(JSON.stringify(await vl.inferenceProducts(), null, 2));
    return;
  }

  if (command === 'ai-kernel-products') {
    console.log(JSON.stringify(await vl.aiKernelProducts(), null, 2));
    return;
  }

  if (command === 'foundation-model-cloud-products') {
    console.log(JSON.stringify(await vl.foundationModelCloudProducts(), null, 2));
    return;
  }

  if (command === 'model-training-platform-engine') {
    console.log(JSON.stringify(await vl.modelTrainingPlatformEngine(), null, 2));
    return;
  }

  if (command === 'model-evaluation-platform-engine') {
    console.log(JSON.stringify(await vl.modelEvaluationPlatformEngine(), null, 2));
    return;
  }

  if (command === 'model-registry-engine') {
    console.log(JSON.stringify(await vl.modelRegistryEngine(), null, 2));
    return;
  }

  if (command === 'atlas-engine') {
    console.log(JSON.stringify(await vl.atlasEngine(), null, 2));
    return;
  }

  if (command === 'ai-fabric-products') {
    console.log(JSON.stringify(await vl.aiFabricProducts(), null, 2));
    return;
  }

  if (command === 'event-fabric-products') {
    console.log(JSON.stringify(await vl.eventFabricProducts(), null, 2));
    return;
  }

  if (command === 'event-fabric-publish') {
    const topic = argValue(rest, '--topic') ?? 'default';
    const type = argValue(rest, '--type') ?? 'com.verbalab.event';
    const dataRaw = argValue(rest, '--data');
    const data = dataRaw ? JSON.parse(dataRaw) : { ok: true };
    console.log(
      JSON.stringify(await vl.eventFabricPublish({ topic, type, data }), null, 2),
    );
    return;
  }

  if (command === 'event-fabric-poll') {
    console.log(
      JSON.stringify(
        await vl.eventFabricPoll({
          topic: argValue(rest, '--topic') ?? undefined,
          count: argValue(rest, '--count')
            ? Number(argValue(rest, '--count'))
            : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'context-fabric-products') {
    console.log(JSON.stringify(await vl.contextFabricProducts(), null, 2));
    return;
  }

  if (command === 'context-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.contextFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'knowledge-fabric-products') {
    console.log(JSON.stringify(await vl.knowledgeFabricProducts(), null, 2));
    return;
  }

  if (command === 'knowledge-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.knowledgeFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'knowledge-fabric-federate') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.knowledgeFabricFederate(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'prompt-fabric-products') {
    console.log(JSON.stringify(await vl.promptFabricProducts(), null, 2));
    return;
  }

  if (command === 'prompt-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    const feature = argValue(rest, '--feature') ?? undefined;
    console.log(
      JSON.stringify(
        await vl.promptFabricRoute({
          ...(kinds.length ? { kinds } : {}),
          ...(feature ? { feature } : {}),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'reasoning-fabric-products') {
    console.log(JSON.stringify(await vl.reasoningFabricProducts(), null, 2));
    return;
  }

  if (command === 'reasoning-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.reasoningFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'reasoning-fabric-pipeline') {
    const pipelineId = argValue(rest, '--id') ?? undefined;
    console.log(
      JSON.stringify(
        await vl.reasoningFabricPipeline(pipelineId ? { pipelineId } : {}),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'memory-fabric-products') {
    console.log(JSON.stringify(await vl.memoryFabricProducts(), null, 2));
    return;
  }

  if (command === 'memory-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.memoryFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'memory-fabric-pipeline') {
    const pipelineId = argValue(rest, '--id') ?? undefined;
    console.log(
      JSON.stringify(
        await vl.memoryFabricPipeline(pipelineId ? { pipelineId } : {}),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'agent-fabric-products') {
    console.log(JSON.stringify(await vl.agentFabricProducts(), null, 2));
    return;
  }

  if (command === 'agent-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.agentFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'agent-fabric-pipeline') {
    const pipelineId = argValue(rest, '--id') ?? undefined;
    console.log(
      JSON.stringify(
        await vl.agentFabricPipeline(pipelineId ? { pipelineId } : {}),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'policy-fabric-products') {
    console.log(JSON.stringify(await vl.policyFabricProducts(), null, 2));
    return;
  }

  if (command === 'ecosystem-cloud-products') {
    console.log(JSON.stringify(await vl.ecosystemCloudProducts(), null, 2));
    return;
  }

  if (command === 'plugin-marketplace-engine') {
    console.log(JSON.stringify(await vl.pluginMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'model-marketplace-engine') {
    console.log(JSON.stringify(await vl.modelMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'dataset-marketplace-engine') {
    console.log(JSON.stringify(await vl.datasetMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'prompt-marketplace-engine') {
    console.log(JSON.stringify(await vl.promptMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'agent-marketplace-engine') {
    console.log(JSON.stringify(await vl.agentMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'workflow-marketplace-engine') {
    console.log(JSON.stringify(await vl.workflowMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'connector-marketplace-engine') {
    console.log(JSON.stringify(await vl.connectorMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'voice-language-marketplace-engine') {
    console.log(JSON.stringify(await vl.voiceLanguageMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'creator-economy-engine') {
    console.log(JSON.stringify(await vl.creatorEconomyEngine(), null, 2));
    return;
  }

  if (command === 'african-intelligence-cloud-products') {
    console.log(JSON.stringify(await vl.africanIntelligenceCloudProducts(), null, 2));
    return;
  }

  if (command === 'african-language-registry-engine') {
    console.log(JSON.stringify(await vl.africanLanguageRegistryEngine(), null, 2));
    return;
  }

  if (command === 'cultural-intelligence-engine') {
    console.log(JSON.stringify(await vl.culturalIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'african-knowledge-graph-engine') {
    console.log(JSON.stringify(await vl.africanKnowledgeGraphEngine(), null, 2));
    return;
  }

  if (command === 'government-intelligence-engine') {
    console.log(JSON.stringify(await vl.governmentIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'healthcare-intelligence-engine') {
    console.log(JSON.stringify(await vl.healthcareIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'financial-intelligence-engine') {
    console.log(JSON.stringify(await vl.financialIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'education-intelligence-engine') {
    console.log(JSON.stringify(await vl.educationIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'agricultural-intelligence-engine') {
    console.log(JSON.stringify(await vl.agriculturalIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'tourism-heritage-intelligence-engine') {
    console.log(JSON.stringify(await vl.tourismHeritageIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'research-cloud-products') {
    console.log(JSON.stringify(await vl.researchCloudProducts(), null, 2));
    return;
  }

  if (command === 'mlops-llmops-cloud-products') {
    console.log(JSON.stringify(await vl.mlopsLlmopsCloudProducts(), null, 2));
    return;
  }

  if (command === 'dataset-pipeline-engine') {
    console.log(JSON.stringify(await vl.datasetPipelineEngine(), null, 2));
    return;
  }

  if (command === 'training-pipeline-engine') {
    console.log(JSON.stringify(await vl.trainingPipelineEngine(), null, 2));
    return;
  }

  if (command === 'continuous-evaluation-engine') {
    console.log(JSON.stringify(await vl.continuousEvaluationEngine(), null, 2));
    return;
  }

  if (command === 'promptops-platform-engine') {
    console.log(JSON.stringify(await vl.promptopsPlatformEngine(), null, 2));
    return;
  }

  if (command === 'ragops-platform-engine') {
    console.log(JSON.stringify(await vl.ragopsPlatformEngine(), null, 2));
    return;
  }

  if (command === 'agentops-platform-engine') {
    console.log(JSON.stringify(await vl.agentopsPlatformEngine(), null, 2));
    return;
  }

  if (command === 'ai-drift-detection-engine') {
    console.log(JSON.stringify(await vl.aiDriftDetectionEngine(), null, 2));
    return;
  }

  if (command === 'continuous-learning-engine') {
    console.log(JSON.stringify(await vl.continuousLearningEngine(), null, 2));
    return;
  }

  if (command === 'ai-operations-dashboard-engine') {
    console.log(JSON.stringify(await vl.aiOperationsDashboardEngine(), null, 2));
    return;
  }
  if (command === 'trust-cloud-products') {
    console.log(JSON.stringify(await vl.trustCloudProducts(), null, 2));
    return;
  }

  if (command === 'ai-safety-platform-engine') {
    console.log(JSON.stringify(await vl.aiSafetyPlatformEngine(), null, 2));
    return;
  }

  if (command === 'ai-governance-platform-engine') {
    console.log(JSON.stringify(await vl.aiGovernancePlatformEngine(), null, 2));
    return;
  }

  if (command === 'explainability-platform-engine') {
    console.log(JSON.stringify(await vl.explainabilityPlatformEngine(), null, 2));
    return;
  }

  if (command === 'privacy-platform-engine') {
    console.log(JSON.stringify(await vl.privacyPlatformEngine(), null, 2));
    return;
  }

  if (command === 'compliance-platform-engine') {
    console.log(JSON.stringify(await vl.compliancePlatformEngine(), null, 2));
    return;
  }

  if (command === 'risk-intelligence-engine') {
    console.log(JSON.stringify(await vl.riskIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'identity-federation-engine') {
    console.log(JSON.stringify(await vl.identityFederationEngine(), null, 2));
    return;
  }

  if (command === 'trust-analytics-engine') {
    console.log(JSON.stringify(await vl.trustAnalyticsEngine(), null, 2));
    return;
  }
  if (command === 'platform-engineering-cloud-products') {
    console.log(JSON.stringify(await vl.platformEngineeringCloudProducts(), null, 2));
    return;
  }

  if (command === 'internal-developer-portal-engine') {
    console.log(JSON.stringify(await vl.internalDeveloperPortalEngine(), null, 2));
    return;
  }

  if (command === 'service-catalog-engine') {
    console.log(JSON.stringify(await vl.serviceCatalogEngine(), null, 2));
    return;
  }

  if (command === 'golden-path-platform-engine') {
    console.log(JSON.stringify(await vl.goldenPathPlatformEngine(), null, 2));
    return;
  }

  if (command === 'gitops-platform-engine') {
    console.log(JSON.stringify(await vl.gitopsPlatformEngine(), null, 2));
    return;
  }

  if (command === 'release-engineering-engine') {
    console.log(JSON.stringify(await vl.releaseEngineeringEngine(), null, 2));
    return;
  }

  if (command === 'reliability-engineering-engine') {
    console.log(JSON.stringify(await vl.reliabilityEngineeringEngine(), null, 2));
    return;
  }

  if (command === 'finops-platform-engine') {
    console.log(JSON.stringify(await vl.finopsPlatformEngine(), null, 2));
    return;
  }

  if (command === 'supply-chain-security-engine') {
    console.log(JSON.stringify(await vl.supplyChainSecurityEngine(), null, 2));
    return;
  }

  if (command === 'developer-experience-platform-engine') {
    console.log(JSON.stringify(await vl.developerExperiencePlatformEngine(), null, 2));
    return;
  }

  if (command === 'platform-engineering-analytics-engine') {
    console.log(JSON.stringify(await vl.platformEngineeringAnalyticsEngine(), null, 2));
    return;
  }
  if (command === 'control-plane-cloud-products') {
    console.log(JSON.stringify(await vl.controlPlaneCloudProducts(), null, 2));
    return;
  }

  if (command === 'organization-control-engine') {
    console.log(JSON.stringify(await vl.organizationControlEngine(), null, 2));
    return;
  }

  if (command === 'global-configuration-platform-engine') {
    console.log(JSON.stringify(await vl.globalConfigurationPlatformEngine(), null, 2));
    return;
  }

  if (command === 'global-policy-engine-engine') {
    console.log(JSON.stringify(await vl.globalPolicyEngineEngine(), null, 2));
    return;
  }

  if (command === 'global-deployment-controller-engine') {
    console.log(JSON.stringify(await vl.globalDeploymentControllerEngine(), null, 2));
    return;
  }

  if (command === 'global-routing-controller-engine') {
    console.log(JSON.stringify(await vl.globalRoutingControllerEngine(), null, 2));
    return;
  }

  if (command === 'secrets-certificate-platform-engine') {
    console.log(JSON.stringify(await vl.secretsCertificatePlatformEngine(), null, 2));
    return;
  }

  if (command === 'global-scheduler-engine') {
    console.log(JSON.stringify(await vl.globalSchedulerEngine(), null, 2));
    return;
  }

  if (command === 'control-plane-analytics-engine') {
    console.log(JSON.stringify(await vl.controlPlaneAnalyticsEngine(), null, 2));
    return;
  }
  if (command === 'data-plane-cloud-products') {
    console.log(JSON.stringify(await vl.dataPlaneCloudProducts(), null, 2));
    return;
  }

  if (command === 'translation-runtime-engine') {
    console.log(JSON.stringify(await vl.translationRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'speech-runtime-engine') {
    console.log(JSON.stringify(await vl.speechRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'voice-runtime-engine') {
    console.log(JSON.stringify(await vl.voiceRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'vision-runtime-engine') {
    console.log(JSON.stringify(await vl.visionRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-runtime-engine') {
    console.log(JSON.stringify(await vl.knowledgeRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'embedding-runtime-engine') {
    console.log(JSON.stringify(await vl.embeddingRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'data-plane-streaming-engine') {
    console.log(JSON.stringify(await vl.dataPlaneStreamingEngine(), null, 2));
    return;
  }

  if (command === 'gpu-runtime-engine') {
    console.log(JSON.stringify(await vl.gpuRuntimeEngine(), null, 2));
    return;
  }
  if (command === 'vaios-products') {
    console.log(JSON.stringify(await vl.vaiosProducts(), null, 2));
    return;
  }

  if (command === 'ai-scheduler-engine') {
    console.log(JSON.stringify(await vl.aiSchedulerEngine(), null, 2));
    return;
  }

  if (command === 'runtime-manager-engine') {
    console.log(JSON.stringify(await vl.runtimeManagerEngine(), null, 2));
    return;
  }

  if (command === 'resource-manager-engine') {
    console.log(JSON.stringify(await vl.resourceManagerEngine(), null, 2));
    return;
  }

  if (command === 'workflow-operating-system-engine') {
    console.log(JSON.stringify(await vl.workflowOperatingSystemEngine(), null, 2));
    return;
  }

  if (command === 'agent-operating-system-engine') {
    console.log(JSON.stringify(await vl.agentOperatingSystemEngine(), null, 2));
    return;
  }

  if (command === 'ai-memory-operating-system-engine') {
    console.log(JSON.stringify(await vl.aiMemoryOperatingSystemEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-operating-system-engine') {
    console.log(JSON.stringify(await vl.knowledgeOperatingSystemEngine(), null, 2));
    return;
  }

  if (command === 'plugin-operating-system-engine') {
    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));
    return;
  }
  if (command === 'enterprise-engineering-system-products') {
    console.log(JSON.stringify(await vl.enterpriseEngineeringSystemProducts(), null, 2));
    return;
  }

  if (command === 'engineering-governance-engine') {
    console.log(JSON.stringify(await vl.engineeringGovernanceEngine(), null, 2));
    return;
  }

  if (command === 'architecture-governance-engine') {
    console.log(JSON.stringify(await vl.architectureGovernanceEngine(), null, 2));
    return;
  }

  if (command === 'repository-standards-engine') {
    console.log(JSON.stringify(await vl.repositoryStandardsEngine(), null, 2));
    return;
  }

  if (command === 'engineering-quality-platform-engine') {
    console.log(JSON.stringify(await vl.engineeringQualityPlatformEngine(), null, 2));
    return;
  }

  if (command === 'ai-engineering-standards-engine') {
    console.log(JSON.stringify(await vl.aiEngineeringStandardsEngine(), null, 2));
    return;
  }

  if (command === 'api-engineering-standards-engine') {
    console.log(JSON.stringify(await vl.apiEngineeringStandardsEngine(), null, 2));
    return;
  }

  if (command === 'database-engineering-standards-engine') {
    console.log(JSON.stringify(await vl.databaseEngineeringStandardsEngine(), null, 2));
    return;
  }

  if (command === 'infrastructure-engineering-standards-engine') {
    console.log(JSON.stringify(await vl.infrastructureEngineeringStandardsEngine(), null, 2));
    return;
  }

  if (command === 'ai-engineering-standards-checks') {
    console.log(JSON.stringify(await vl.aiEngineeringStandardsChecks(), null, 2));
    return;
  }







  if (command === 'experiment-platform-engine') {
    console.log(JSON.stringify(await vl.experimentPlatformEngine(), null, 2));
    return;
  }

  if (command === 'synthetic-data-platform-engine') {
    console.log(JSON.stringify(await vl.syntheticDataPlatformEngine(), null, 2));
    return;
  }

  if (command === 'benchmark-platform-engine') {
    console.log(JSON.stringify(await vl.benchmarkPlatformEngine(), null, 2));
    return;
  }

  if (command === 'evaluation-platform-engine') {
    console.log(JSON.stringify(await vl.evaluationPlatformEngine(), null, 2));
    return;
  }

  if (command === 'ai-publication-platform-engine') {
    console.log(JSON.stringify(await vl.aiPublicationPlatformEngine(), null, 2));
    return;
  }

  if (command === 'patent-innovation-platform-engine') {
    console.log(JSON.stringify(await vl.patentInnovationPlatformEngine(), null, 2));
    return;
  }

  if (command === 'open-science-platform-engine') {
    console.log(JSON.stringify(await vl.openSciencePlatformEngine(), null, 2));
    return;
  }

  if (command === 'research-analytics-engine') {
    console.log(JSON.stringify(await vl.researchAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'policy-fabric-route') {
    const kinds: string[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--kind' && rest[i + 1]) {
        kinds.push(rest[i + 1]!);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(await vl.policyFabricRoute(kinds.length ? { kinds } : {}), null, 2),
    );
    return;
  }

  if (command === 'policy-fabric-pipeline') {
    const pipelineId = argValue(rest, '--id') ?? undefined;
    console.log(
      JSON.stringify(
        await vl.policyFabricPipeline(pipelineId ? { pipelineId } : {}),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'memory-runtime-engine') {
    console.log(JSON.stringify(await vl.memoryRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'memory-runtime-put') {
    const content = argValue(rest, '--content');
    if (!content) usage();
    console.log(
      JSON.stringify(
        await vl.memoryRuntimePut({
          content,
          scope: argValue(rest, '--scope') ?? undefined,
          kind: argValue(rest, '--kind') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prompt-runtime-engine') {
    console.log(JSON.stringify(await vl.promptRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'prompt-runtime-execute') {
    const variables: Record<string, string> = {};
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === '--var' && rest[i + 1]) {
        const raw = rest[i + 1]!;
        const eq = raw.indexOf('=');
        if (eq > 0) variables[raw.slice(0, eq)] = raw.slice(eq + 1);
        i += 1;
      }
    }
    console.log(
      JSON.stringify(
        await vl.promptRuntimeExecute({
          key: argValue(rest, '--key') ?? undefined,
          feature: argValue(rest, '--feature') ?? undefined,
          variables: Object.keys(variables).length ? variables : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'context-runtime-engine') {
    console.log(JSON.stringify(await vl.contextRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'context-runtime-assemble') {
    const maxCharsRaw = argValue(rest, '--max-chars');
    console.log(
      JSON.stringify(
        await vl.contextRuntimeAssemble({
          query: argValue(rest, '--query') ?? undefined,
          modelHint: argValue(rest, '--model') ?? undefined,
          maxChars: maxCharsRaw ? Number(maxCharsRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'reasoning-runtime-engine') {
    console.log(JSON.stringify(await vl.reasoningRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'reasoning-runtime-plan') {
    const problem = argValue(rest, '--problem');
    if (!problem) usage();
    console.log(
      JSON.stringify(
        await vl.reasoningRuntimePlan({
          problem,
          sandboxOnly: rest.includes('--sandbox'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'agent-runtime-engine') {
    console.log(JSON.stringify(await vl.agentRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'agent-runtime-create') {
    const name = argValue(rest, '--name');
    if (!name) usage();
    const permissions: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--permission' && rest[i + 1]) {
        permissions.push(rest[i + 1]!);
        i++;
      }
    }
    console.log(
      JSON.stringify(
        await vl.agentRuntimeCreate({
          name,
          permissions: permissions.length ? permissions : undefined,
          goal: argValue(rest, '--goal') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'agent-runtime-run') {
    const agentId = argValue(rest, '--agent');
    if (!agentId) usage();
    const action = argValue(rest, '--action');
    console.log(
      JSON.stringify(
        await vl.agentRuntimeRun({
          agentId,
          goal: argValue(rest, '--goal') ?? undefined,
          actions: action ? [{ action }] : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'workflow-runtime-engine') {
    console.log(JSON.stringify(await vl.workflowRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'workflow-runtime-create') {
    const name = argValue(rest, '--name');
    if (!name) usage();
    const permissions: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--permission' && rest[i + 1]) {
        permissions.push(rest[i + 1]!);
        i++;
      }
    }
    console.log(
      JSON.stringify(
        await vl.workflowRuntimeCreate({
          name,
          permissions: permissions.length ? permissions : undefined,
          mode: argValue(rest, '--mode') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'workflow-runtime-run') {
    const workflowId = argValue(rest, '--workflow');
    if (!workflowId) usage();
    console.log(
      JSON.stringify(
        await vl.workflowRuntimeRun({
          workflowId,
          approved: rest.includes('--approved'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'plugin-runtime-engine') {
    console.log(JSON.stringify(await vl.pluginRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'plugin-runtime-register') {
    const name = argValue(rest, '--name');
    if (!name) usage();
    const permissions: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--permission' && rest[i + 1]) {
        permissions.push(rest[i + 1]!);
        i++;
      }
    }
    console.log(
      JSON.stringify(
        await vl.pluginRuntimeRegister({
          name,
          permissions: permissions.length ? permissions : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'plugin-runtime-invoke') {
    const pluginId = argValue(rest, '--plugin');
    if (!pluginId) usage();
    const action = argValue(rest, '--action');
    console.log(
      JSON.stringify(
        await vl.pluginRuntimeInvoke({
          pluginId,
          actions: action ? [{ action }] : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'policy-runtime-engine') {
    console.log(JSON.stringify(await vl.policyRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'policy-runtime-evaluate') {
    const action = argValue(rest, '--action');
    if (!action) usage();
    console.log(
      JSON.stringify(
        await vl.policyRuntimeEvaluate({
          action,
          runtime: argValue(rest, '--runtime') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'policy-runtime-create') {
    const name = argValue(rest, '--name');
    const action = argValue(rest, '--action');
    if (!name || !action) usage();
    console.log(
      JSON.stringify(
        await vl.policyRuntimeCreate({
          name,
          actions: [action],
          kind: argValue(rest, '--kind') ?? undefined,
          effect: argValue(rest, '--effect') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'gpu-platform-engine') {
    console.log(JSON.stringify(await vl.gpuPlatformEngine(), null, 2));
    return;
  }

  if (command === 'gpu-platform-pools') {
    console.log(
      JSON.stringify(
        await vl.gpuPlatformPools({ vendor: argValue(rest, '--vendor') ?? undefined }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'gpu-platform-allocate') {
    const poolId = argValue(rest, '--pool');
    if (!poolId) usage();
    const instancesRaw = argValue(rest, '--instances');
    console.log(
      JSON.stringify(
        await vl.gpuPlatformAllocate({
          poolId,
          instances: instancesRaw ? Number(instancesRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'model-serving-engine') {
    console.log(JSON.stringify(await vl.modelServingEngine(), null, 2));
    return;
  }

  if (command === 'model-serving-kinds') {
    console.log(JSON.stringify(await vl.modelServingKinds(), null, 2));
    return;
  }

  if (command === 'model-serving-endpoints') {
    console.log(
      JSON.stringify(
        await vl.modelServingEndpoints({ kind: argValue(rest, '--kind') ?? undefined }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'model-serving-deploy') {
    const kind = argValue(rest, '--kind');
    const modelSlug = argValue(rest, '--model');
    if (!kind || !modelSlug) usage();
    console.log(
      JSON.stringify(
        await vl.modelServingDeploy({
          kind,
          modelSlug,
          version: argValue(rest, '--version') ?? undefined,
          strategy: argValue(rest, '--strategy') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'ai-router-engine') {
    console.log(JSON.stringify(await vl.aiRouterEngine(), null, 2));
    return;
  }

  if (command === 'ai-router-resolve') {
    console.log(
      JSON.stringify(
        await vl.aiRouterResolve({
          feature: argValue(rest, '--feature') ?? undefined,
          optimize: argValue(rest, '--optimize') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'streaming-runtime-engine') {
    console.log(JSON.stringify(await vl.streamingRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'streaming-runtime-surfaces') {
    console.log(
      JSON.stringify(
        await vl.streamingRuntimeSurfaces({
          kind: argValue(rest, '--kind') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'batch-runtime-engine') {
    console.log(JSON.stringify(await vl.batchRuntimeEngine(), null, 2));
    return;
  }

  if (command === 'batch-runtime-run') {
    const kind = argValue(rest, '--kind');
    const item = argValue(rest, '--item');
    if (!kind || !item) usage();
    console.log(
      JSON.stringify(
        await vl.batchRuntimeCreateRun({
          kind,
          items: [item],
          priority: argValue(rest, '--priority') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligent-cache-engine') {
    console.log(JSON.stringify(await vl.intelligentCacheEngine(), null, 2));
    return;
  }

  if (command === 'intelligent-cache-put') {
    const namespace = argValue(rest, '--namespace');
    const key = argValue(rest, '--key');
    if (!namespace || !key) usage();
    const valueRaw = argValue(rest, '--value');
    console.log(
      JSON.stringify(
        await vl.intelligentCachePut({
          namespace,
          key,
          value: valueRaw ? JSON.parse(valueRaw) : { ok: true },
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligent-cache-lookup') {
    const namespace = argValue(rest, '--namespace');
    const key = argValue(rest, '--key');
    if (!namespace || !key) usage();
    console.log(
      JSON.stringify(await vl.intelligentCacheLookup({ namespace, key }), null, 2),
    );
    return;
  }

  if (command === 'cost-optimization-engine') {
    console.log(JSON.stringify(await vl.costOptimizationEngine(), null, 2));
    return;
  }

  if (command === 'cost-optimization-record') {
    const category = argValue(rest, '--category');
    const amount = argValue(rest, '--amount');
    if (!category || !amount) usage();
    console.log(
      JSON.stringify(
        await vl.costOptimizationRecord({
          category,
          amountUsd: Number(amount),
          feature: argValue(rest, '--feature') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'cost-optimization-optimize') {
    console.log(
      JSON.stringify(
        await vl.costOptimizationOptimize({
          feature: argValue(rest, '--feature') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'ai-runtime-analytics-engine') {
    console.log(JSON.stringify(await vl.aiRuntimeAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'ai-runtime-analytics-overview') {
    console.log(
      JSON.stringify(
        await vl.aiRuntimeAnalyticsOverview({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'ai-runtime-analytics-report') {
    console.log(
      JSON.stringify(
        await vl.aiRuntimeAnalyticsReport({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'knowledge-base-engine') {
    console.log(JSON.stringify(await vl.knowledgeBaseEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-search-engine') {
    console.log(JSON.stringify(await vl.enterpriseSearchEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-search') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseSearch({ query, mode }), null, 2),
    );
    return;
  }

  if (command === 'ontology-engine') {
    console.log(JSON.stringify(await vl.ontologyEngine(), null, 2));
    return;
  }

  if (command === 'taxonomy-engine') {
    console.log(JSON.stringify(await vl.taxonomyEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-rag-engine') {
    console.log(JSON.stringify(await vl.enterpriseRagEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-rag-retrieve') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseRagRetrieve({ query, mode }), null, 2),
    );
    return;
  }

  if (command === 'enterprise-rag-query') {
    const question = argValue(rest, '--question');
    if (!question) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseRagQuery({ question, mode }), null, 2),
    );
    return;
  }

  if (command === 'knowledge-memory-engine') {
    console.log(JSON.stringify(await vl.knowledgeMemoryEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-intelligence-engine') {
    console.log(JSON.stringify(await vl.knowledgeIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-intelligence-discover') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    console.log(
      JSON.stringify(await vl.knowledgeIntelligenceDiscover({ query }), null, 2),
    );
    return;
  }

  if (command === 'knowledge-apis-engine') {
    console.log(JSON.stringify(await vl.knowledgeApisEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-apis-surfaces') {
    console.log(JSON.stringify(await vl.knowledgeApisSurfaces(), null, 2));
    return;
  }

  if (command === 'knowledge-analytics') {
    console.log(JSON.stringify(await vl.knowledgeAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-analytics-overview') {
    console.log(
      JSON.stringify(
        await vl.knowledgeAnalyticsOverview({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'knowledge-analytics-report') {
    console.log(
      JSON.stringify(
        await vl.knowledgeAnalyticsReport({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'embedding-cloud-engine') {
    console.log(JSON.stringify(await vl.embeddingCloudEngine(), null, 2));
    return;
  }

  if (command === 'embedding-cloud-models') {
    console.log(JSON.stringify(await vl.embeddingCloudModels(), null, 2));
    return;
  }

  if (command === 'vector-cloud-engine') {
    console.log(JSON.stringify(await vl.vectorCloudEngine(), null, 2));
    return;
  }

  if (command === 'vector-cloud-search') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const kRaw = argValue(rest, '--k');
    console.log(
      JSON.stringify(
        await vl.vectorCloudSearch({
          query,
          k: kRaw ? Number(kRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'memory-cloud-engine') {
    console.log(JSON.stringify(await vl.memoryCloudEngine(), null, 2));
    return;
  }

  if (command === 'memory-cloud-export') {
    console.log(
      JSON.stringify(
        await vl.memoryCloudExport({
          subjectUserId: argValue(rest, '--subject'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'knowledge-graph-engine') {
    console.log(JSON.stringify(await vl.knowledgeGraphEngine(), null, 2));
    return;
  }

  if (command === 'context-engine') {
    console.log(JSON.stringify(await vl.contextEngine(), null, 2));
    return;
  }

  if (command === 'context-assemble') {
    const maxRaw = argValue(rest, '--max-chars');
    console.log(
      JSON.stringify(
        await vl.contextAssemble({
          query: argValue(rest, '--query'),
          maxChars: maxRaw ? Number(maxRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'reasoning-cloud-engine') {
    console.log(JSON.stringify(await vl.reasoningCloudEngine(), null, 2));
    return;
  }

  if (command === 'reasoning-cloud-reason') {
    const problem = argValue(rest, '--problem');
    if (!problem) usage();
    console.log(
      JSON.stringify(
        await vl.reasoningCloudReason({
          problem,
          strategy: argValue(rest, '--strategy'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'recommendation-engine') {
    console.log(JSON.stringify(await vl.recommendationEngine(), null, 2));
    return;
  }

  if (command === 'recommend') {
    const kind = argValue(rest, '--kind');
    if (!kind) usage();
    console.log(
      JSON.stringify(
        await vl.recommend({
          kind,
          query: argValue(rest, '--query'),
          language: argValue(rest, '--language'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prompt-intelligence') {
    console.log(JSON.stringify(await vl.promptIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'prompt-intelligence-preview') {
    const key = argValue(rest, '--key');
    if (!key) usage();
    console.log(
      JSON.stringify(
        await vl.promptIntelligencePreview({
          key,
          body: argValue(rest, '--body'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prompt-intelligence-evaluate') {
    const key = argValue(rest, '--key');
    if (!key) usage();
    console.log(
      JSON.stringify(
        await vl.promptIntelligenceEvaluate({
          key,
          body: argValue(rest, '--body'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'decision-engine') {
    console.log(JSON.stringify(await vl.decisionEngine(), null, 2));
    return;
  }

  if (command === 'decide') {
    const kind = argValue(rest, '--kind');
    if (!kind) usage();
    console.log(
      JSON.stringify(
        await vl.decide({
          kind,
          query: argValue(rest, '--query'),
          family: argValue(rest, '--family'),
          quality: argValue(rest, '--quality'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'ai-orchestration') {
    console.log(JSON.stringify(await vl.aiOrchestrationEngine(), null, 2));
    return;
  }

  if (command === 'ai-orchestration-run') {
    const pipeline = argValue(rest, '--pipeline');
    const text = argValue(rest, '--text');
    if (!pipeline || !text) usage();
    console.log(
      JSON.stringify(
        await vl.aiOrchestrationRun({
          pipeline,
          text,
          target: argValue(rest, '--target'),
          source: argValue(rest, '--source'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligence-analytics') {
    console.log(JSON.stringify(await vl.intelligenceAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'intelligence-analytics-overview') {
    console.log(
      JSON.stringify(
        await vl.intelligenceAnalyticsOverview({
          from: argValue(rest, '--from'),
          to: argValue(rest, '--to'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligence-analytics-report') {
    console.log(
      JSON.stringify(
        await vl.intelligenceAnalyticsReport({
          from: argValue(rest, '--from'),
          to: argValue(rest, '--to'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'neural-tts-engine') {
    console.log(JSON.stringify(await vl.neuralTtsEngine(), null, 2));
    return;
  }

  if (command === 'neural-tts-voices') {
    console.log(
      JSON.stringify(
        await vl.neuralTtsVoices({
          gender: argValue(argv, '--gender'),
          language: argValue(argv, '--language'),
          category: argValue(argv, '--category'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'voice-cloning-engine') {
    console.log(JSON.stringify(await vl.voiceCloningEngine(), null, 2));
    return;
  }

  if (command === 'voice-cloning-consent') {
    console.log(JSON.stringify(await vl.voiceCloningConsentPolicy(), null, 2));
    return;
  }

  if (command === 'emotion-voice-engine') {
    console.log(JSON.stringify(await vl.emotionVoiceEngine(), null, 2));
    return;
  }

  if (command === 'emotion-voice-profiles') {
    console.log(JSON.stringify(await vl.emotionVoiceProfiles(), null, 2));
    return;
  }

  if (command === 'voice-studio-engine') {
    console.log(JSON.stringify(await vl.voiceStudioEngine(), null, 2));
    return;
  }

  if (command === 'voice-studio-library') {
    console.log(JSON.stringify(await vl.voiceStudioLibrary(), null, 2));
    return;
  }

  if (command === 'voice-enhancement-engine') {
    console.log(JSON.stringify(await vl.voiceEnhancementEngine(), null, 2));
    return;
  }

  if (command === 'voice-enhancement-profiles') {
    console.log(JSON.stringify(await vl.voiceEnhancementProfiles(), null, 2));
    return;
  }

  if (command === 'voice-biometrics-engine') {
    console.log(JSON.stringify(await vl.voiceBiometricsEngine(), null, 2));
    return;
  }

  if (command === 'voice-biometrics-encryption') {
    console.log(JSON.stringify(await vl.voiceBiometricsEncryption(), null, 2));
    return;
  }

  if (command === 'voice-marketplace-engine') {
    console.log(JSON.stringify(await vl.voiceMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'voice-marketplace-language-packs') {
    console.log(JSON.stringify(await vl.voiceMarketplaceLanguagePacks(), null, 2));
    return;
  }

  if (command === 'voice-analytics') {
    console.log(JSON.stringify(await vl.voiceAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'speech-engine') {
    console.log(JSON.stringify(await vl.speechEngine(), null, 2));
    return;
  }

  if (command === 'speaker-engine') {
    console.log(JSON.stringify(await vl.speakerEngine(), null, 2));
    return;
  }

  if (command === 'accent-engine') {
    console.log(JSON.stringify(await vl.accentEngine(), null, 2));
    return;
  }

  if (command === 'emotion-engine') {
    console.log(JSON.stringify(await vl.emotionEngine(), null, 2));
    return;
  }

  if (command === 'audio-engine') {
    console.log(JSON.stringify(await vl.audioEngine(), null, 2));
    return;
  }

  if (command === 'pronunciation-engine') {
    console.log(JSON.stringify(await vl.pronunciationEngine(), null, 2));
    return;
  }

  if (command === 'wake-word-engine') {
    console.log(JSON.stringify(await vl.wakeWordEngine(), null, 2));
    return;
  }

  if (command === 'call-engine') {
    console.log(JSON.stringify(await vl.callIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'speech-analytics') {
    console.log(JSON.stringify(await vl.speechAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'whoami') {
    const key = process.env.VERBALAB_API_KEY!;
    console.log(
      JSON.stringify(
        {
          environment: key.startsWith('vl_test_') ? 'test' : 'live',
          baseUrl: process.env.VERBALAB_API_URL ?? 'https://api.verbalab.ai',
          keyPrefix: key.slice(0, 12) + '…',
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'translate-engine') {
    console.log(JSON.stringify(await vl.translateEngine(), null, 2));
    return;
  }

  if (command === 'translate') {
    const text = argValue(rest, '--text');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'auto';
    if (!text || !target) usage();
    console.log(JSON.stringify(await vl.translate({ text, source, target }), null, 2));
    return;
  }

  if (command === 'translate-format') {
    const format = argValue(rest, '--format');
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!format || !file || !target) usage();
    const content = readFileSync(file, 'utf8');
    console.log(
      JSON.stringify(await vl.translateFormat({ format, content, source, target }), null, 2),
    );
    return;
  }

  if (command === 'localize') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!file || !target) usage();
    const raw = readFileSync(file, 'utf8');
    const content = format === 'yaml' ? raw : JSON.parse(raw);
    console.log(JSON.stringify(await vl.localize({ format, content, source, target }), null, 2));
    return;
  }

  if (command === 'locales') {
    console.log(JSON.stringify(await vl.locales(), null, 2));
    return;
  }

  if (command === 'localization') {
    console.log(JSON.stringify(await vl.localizationPlatform(), null, 2));
    return;
  }

  if (command === 'icu-validate') {
    const message = argValue(rest, '--message');
    if (!message) usage();
    console.log(JSON.stringify(await vl.validateIcu(message), null, 2));
    return;
  }

  if (command === 'localize-qa') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const sourceFile = argValue(rest, '--source-file');
    const targetFile = argValue(rest, '--target-file');
    if (!sourceFile || !targetFile) usage();
    const sourceRaw = readFileSync(sourceFile, 'utf8');
    const targetRaw = readFileSync(targetFile, 'utf8');
    const sourceContent = format === 'yaml' ? sourceRaw : JSON.parse(sourceRaw);
    const targetContent = format === 'yaml' ? targetRaw : JSON.parse(targetRaw);
    console.log(
      JSON.stringify(
        await vl.localizeQa({ format, sourceContent, targetContent }),
        null,
        2,
      ),
    );
    return;
  }

  usage();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
