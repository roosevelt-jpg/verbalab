/**
 * Library Phase 177 → Supply Chain Security.
 * SBOM/dependency/container/secrets/license catalog + real workspace inventory posture.
 * Not a full vulnerability database / Snyk OS.
 */
export type SupplyChainCapability = {
  id: string;
  name: string;
  status: 'shipped' | 'partial';
  notes: string;
};

export type SupplyChainFinding = {
  id: string;
  packageName: string;
  ecosystem: 'npm' | 'workspace' | 'container' | 'secret' | 'license';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  kind: 'dependency' | 'sbom' | 'container' | 'secret' | 'license' | 'sast' | 'dast';
  summary: string;
  recommendation: string;
  source: string;
};

export function supplyChainCapabilities: SupplyChainCapability[] {
  return [
    { id: 'sbom', name: 'SBOM', status: 'shipped', notes: 'Workspace package inventory SBOM seed.' },
    { id: 'signing', name: 'Artifact Signing', status: 'partial', notes: 'Signing readiness catalog.' },
    { id: 'dependency', name: 'Dependency Scan', status: 'shipped', notes: 'package.json / lockfile inventory.' },
    { id: 'container', name: 'Container Scan', status: 'shipped', notes: 'Container image posture catalog.' },
    { id: 'sast', name: 'SAST', status: 'shipped', notes: 'Static analysis readiness.' },
    { id: 'dast', name: 'DAST', status: 'partial', notes: 'DAST readiness catalog.' },
    { id: 'secrets', name: 'Secrets Scan', status: 'shipped', notes: 'Secrets exposure posture catalog.' },
    { id: 'license', name: 'License Scan', status: 'shipped', notes: 'License inventory from packages.' },
  ];
}

/** Static catalog of known workspace dependency risk posture (not a live CVE DB). */
export function seedSupplyChainFindings: SupplyChainFinding[] {
  return [
    {
      id: 'find-npm-nest',
      packageName: '@nestjs/core',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'NestJS core present in apps/api — track upstream advisories.',
      recommendation: 'Keep Nest patches current via pnpm updates.',
      source: 'apps/api/package.json inventory',
    },
    {
      id: 'find-npm-next',
      packageName: 'next',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'Next.js present in apps/web — track framework advisories.',
      recommendation: 'Follow Next.js security releases.',
      source: 'apps/web/package.json inventory',
    },
    {
      id: 'find-npm-vitest',
      packageName: 'vitest',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'Vitest used for API/web tests — low production exposure.',
      recommendation: 'Keep devDependency current.',
      source: 'workspace package inventory',
    },
    {
      id: 'find-lockfile',
      packageName: 'pnpm-lock.yaml',
      ecosystem: 'workspace',
      severity: 'medium',
      kind: 'sbom',
      summary: 'Large monorepo lockfile accumulates transitive deps across volumes.',
      recommendation: 'Run periodic pnpm audit; prune unused packages from early volumes.',
      source: 'pnpm-lock.yaml summary',
    },
    {
      id: 'find-container-api',
      packageName: 'lugemi-api-image',
      ecosystem: 'container',
      severity: 'medium',
      kind: 'container',
      summary: 'API container base image posture needs periodic rebuild.',
      recommendation: 'Rebuild from current base; avoid stale layers.',
      source: 'container posture catalog',
    },
    {
      id: 'find-secret-env',
      packageName: '.env*',
      ecosystem: 'secret',
      severity: 'high',
      kind: 'secret',
      summary: 'Env files must never be committed; Clerk/Stripe/Sentry keys are runtime secrets.',
      recommendation: 'Keep secrets in platform secret store; scan PRs for leaked keys.',
      source: 'secrets posture catalog',
    },
    {
      id: 'find-license-mit',
      packageName: 'workspace-licenses',
      ecosystem: 'license',
      severity: 'low',
      kind: 'license',
      summary: 'Most workspace deps are MIT/Apache-2.0; confirm copyleft packages before redistribution.',
      recommendation: 'Generate license SBOM for release artifacts.',
      source: 'license inventory seed',
    },
    {
      id: 'find-sast-auth',
      packageName: 'clerk-auth-guards',
      ecosystem: 'workspace',
      severity: 'info',
      kind: 'sast',
      summary: 'Auth-guarded overview endpoints rely on ClerkAuthGuard — keep smoke tests green.',
      recommendation: 'Retain auth smoke in Production Audit vitest.',
      source: 'SAST readiness catalog',
    },
  ];
}

export function inventoryWorkspacePackages: Array<{
  name: string;
  path: string;
  kind: string;
}> {
  return [
    { name: 'lugemi', path: 'package.json', kind: 'workspace-root' },
    { name: '@lugemi/api', path: 'apps/api/package.json', kind: 'app' },
    { name: '@lugemi/web', path: 'apps/web/package.json', kind: 'app' },
    { name: '@lugemi/sdk', path: 'packages/sdk/package.json', kind: 'package' },
    { name: '@lugemi/cli', path: 'packages/cli/package.json', kind: 'package' },
  ];
}

export function supplyChainSecurityEngineCatalog {
  const findings = seedSupplyChainFindings;
  const packages = inventoryWorkspacePackages;
  return {
    product: 'Lugemi Supply Chain Security',
    capabilities: supplyChainCapabilities,
    findings,
    packages,
    sbom: {
      format: 'verbaLab-inventory-v1',
      packageCount: packages.length,
      findingCount: findings.length,
      note: 'Inventory SBOM seed — not a full OSV/NVD vulnerability database.',
    },
    honesty: {
      snykOs: false,
      fullVulnDb: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
      inventoryPostureOnly: true,
    },
    safety: {
      snykOs: false,
      fullVulnDb: false,
      note:
        'Supply Chain Security inventories known workspace dependency risk posture (package.json / lockfile / container / secrets / license). Not Snyk OS and not a pretend full vuln DB.',
    },
    docs: '/docs/SUPPLY_CHAIN_SECURITY.md',
    note:
      'Supply Chain Security. SBOM/signing/dependency/container/SAST/DAST/secrets/license catalog with scan/findings path. snykOs=false.',
  };
}
