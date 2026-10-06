/**
 * Library Phase 160 → AI Safety Platform.
 * Wires to Policy Runtime / Policy Fabric — does not invent a second policy OS.
 */
export type SafetyDetection = {
  id: string;
  kind:
    | 'prompt_injection'
    | 'indirect_prompt_injection'
    | 'jailbreak'
    | 'hallucination'
    | 'toxicity'
    | 'violence'
    | 'hate'
    | 'abuse'
    | 'malware'
    | 'unsafe_tool'
    | 'prompt_firewall'
    | 'model_firewall'
    | 'safety_policy';
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  blockPosture: 'block' | 'allow_with_warning' | 'monitor';
  policyAction: string;
  notes: string;
};

export function aiSafetyDetectionsCatalog(): SafetyDetection[] {
  return [
    {
      id: 'safe-inj-001',
      kind: 'prompt_injection',
      name: 'Direct prompt injection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'prompt_injection',
      notes: 'Blocks direct injection attempts via Policy Runtime hard gate posture.',
    },
    {
      id: 'safe-inj-002',
      kind: 'indirect_prompt_injection',
      name: 'Indirect prompt injection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'indirect_prompt_injection',
      notes: 'Untrusted retrieved content treated as untrusted instructions.',
    },
    {
      id: 'safe-jb-001',
      kind: 'jailbreak',
      name: 'Jailbreak detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'jailbreak',
      notes: 'Jailbreak phrases mapped to Policy Runtime deny posture.',
    },
    {
      id: 'safe-hal-001',
      kind: 'hallucination',
      name: 'Hallucination risk',
      severity: 'medium',
      blockPosture: 'allow_with_warning',
      policyAction: 'hallucination_risk',
      notes: 'Surfaces low-evidence answers for human review.',
    },
    {
      id: 'safe-tox-001',
      kind: 'toxicity',
      name: 'Toxicity detection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'toxicity',
      notes: 'Toxic content blocked — not log-only.',
    },
    {
      id: 'safe-vio-001',
      kind: 'violence',
      name: 'Violence detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'violence',
      notes: 'Violent content hard-blocked.',
    },
    {
      id: 'safe-hate-001',
      kind: 'hate',
      name: 'Hate speech detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'hate_speech',
      notes: 'Hate speech hard-blocked.',
    },
    {
      id: 'safe-abuse-001',
      kind: 'abuse',
      name: 'Abuse detection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'abuse',
      notes: 'Abuse patterns blocked.',
    },
    {
      id: 'safe-mal-001',
      kind: 'malware',
      name: 'Malware / exploit assist',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'malware_assist',
      notes: 'Malware/exploit assist blocked via Policy Runtime posture.',
    },
    {
      id: 'safe-tool-001',
      kind: 'unsafe_tool',
      name: 'Unsafe tool call',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'unsafe_tool_call',
      notes: 'Aligns with AgentOps tool-allowlist policy violations.',
    },
    {
      id: 'safe-pfw-001',
      kind: 'prompt_firewall',
      name: 'Prompt firewall',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'prompt_firewall',
      notes: 'Prompt firewall rule catalog — enforced via Policy Runtime.',
    },
    {
      id: 'safe-mfw-001',
      kind: 'model_firewall',
      name: 'Model firewall',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'model_firewall',
      notes: 'Model output firewall catalog.',
    },
    {
      id: 'safe-pol-001',
      kind: 'safety_policy',
      name: 'Safety policy pack',
      severity: 'medium',
      blockPosture: 'monitor',
      policyAction: 'safety_policy_pack',
      notes: 'Safety policy pack references Policy Fabric pipelines.',
    },
  ];
}

export function aiSafetyPlatformEngineCatalog() {
  const detections = aiSafetyDetectionsCatalog();
  return {
    product: 'Lugemi AI Safety Platform',
    capabilities: [
      { id: 'prompt_injection', name: 'Prompt Injection Detection', status: 'shipped', notes: 'Direct + indirect.' },
      { id: 'jailbreak', name: 'Jailbreak Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'hallucination', name: 'Hallucination Detection', status: 'shipped', notes: 'Warning posture.' },
      { id: 'toxicity', name: 'Toxicity Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'violence', name: 'Violence Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'hate', name: 'Hate Speech', status: 'shipped', notes: 'Block posture.' },
      { id: 'abuse', name: 'Abuse Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'malware', name: 'Malware Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'unsafe_tool', name: 'Unsafe Tool Calls', status: 'shipped', notes: 'AgentOps aligned.' },
      { id: 'firewalls', name: 'Prompt/Model Firewalls', status: 'shipped', notes: 'Firewall catalog.' },
      { id: 'policies', name: 'Safety Policies', status: 'shipped', notes: 'Policy Runtime integrated.' },
    ],
    detections,
    blockedDetections: detections.filter((d) => d.blockPosture === 'block'),
    honesty: {
      policyRuntimeIntegrated: true,
      regeneratesPolicyRuntime: false,
      regeneratesPolicyFabric: false,
      extendsPolicyRuntime: true,
      extendsPolicyFabric: true,
      secondPolicyOs: false,
      logOnlySafety: false,
    },
    safety: {
      policyRuntimeIntegrated: true,
      hardBlockDefault: true,
      note:
        'Safety detections consult Policy Runtime / Policy Fabric posture. Block is default for critical classes — not log-only.',
    },
    docs: '/docs/AI_SAFETY_PLATFORM.md',
    note: 'AI Safety Platform. Safety engine over Policy Runtime — does not regenerate Volumes 1–14.',
  };
}
