import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PromptsService } from '../prompts/prompts.service';
import { ApiException } from '../common/errors/api-exception';
import {
  PROMPT_KEYS,
  PromptKey,
  defaultPromptBody,
  isPromptKey,
} from '../prompts/prompt-defaults';
import { promptIntelligenceCatalog } from './prompt-intelligence.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type Finding = {
  id: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
};

const INJECTION_PATTERNS: Array<{ id: string; re: RegExp; message: string }> = [
  {
    id: 'ignore-instructions',
    re: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    message: 'Possible prompt-injection override phrase',
  },
  {
    id: 'system-override',
    re: /you\s+are\s+now\s+(dan|jailbroken|unrestricted)/i,
    message: 'Possible jailbreak persona phrase',
  },
  {
    id: 'reveal-system',
    re: /reveal\s+(your\s+)?(system|hidden)\s+prompt/i,
    message: 'Possible system-prompt exfiltration phrase',
  },
];

const SECRET_PATTERNS: Array<{ id: string; re: RegExp; message: string }> = [
  {
    id: 'openai-key',
    re: /sk-[A-Za-z0-9]{20,}/,
    message: 'Looks like an OpenAI-style API key',
  },
  {
    id: 'aws-key',
    re: /AKIA[0-9A-Z]{16}/,
    message: 'Looks like an AWS access key id',
  },
  {
    id: 'bearer-token',
    re: /Bearer\s+[A-Za-z0-9._\-]{20,}/,
    message: 'Looks like a bearer token',
  },
];

@Injectable()
export class PromptIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly prompts: PromptsService,
  ) {}

  engine() {
    return promptIntelligenceCatalog();
  }

  keys() {
    return {
      keys: PROMPT_KEYS.map((id) => ({ id })),
      note: 'Managed prompt keys for (extends existing).',
    };
  }

  async registry(organizationId: string, workspaceId: string) {
    const items = await this.prompts.list(organizationId, workspaceId);
    return {
      items,
      note: 'Prompt registry over workspace versioned prompts.',
    };
  }

  private requireKey(raw: string | undefined): PromptKey {
    if (!raw || !isPromptKey(raw)) {
      throw new ApiException(
        'validation_error',
        `key must be one of ${PROMPT_KEYS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return raw;
  }

  private async resolveBody(
    input: AuthCtx & { key: PromptKey; body?: string; version?: number },
  ): Promise<{ body: string; source: string; version: number | null }> {
    if (input.body?.trim()) {
      return { body: input.body.trim(), source: 'draft', version: null };
    }
    if (input.version != null) {
      const listed = await this.prompts.listVersions({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        key: input.key,
      });
      const match = listed.versions.find((v) => v.version === input.version);
      if (!match) {
        throw new ApiException('not_found', 'Prompt version not found', HttpStatus.NOT_FOUND);
      }
      return { body: match.body, source: 'version', version: match.version };
    }
    const resolved = await this.prompts.resolve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key: input.key,
    });
    return {
      body: resolved.body,
      source: resolved.source,
      version: resolved.version,
    };
  }

  async preview(
    input: AuthCtx & { key?: string; body?: string; version?: number },
  ) {
    const key = this.requireKey(input.key);
    const resolved = await this.resolveBody({ ...input, key });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_intelligence.previewed',
      route: 'POST /v1/prompt-intelligence/preview',
      ip: input.ip,
      metadata: { key, source: resolved.source, chars: resolved.body.length },
    });
    return {
      key,
      source: resolved.source,
      version: resolved.version,
      body: resolved.body,
      chars: [...resolved.body].length,
      honesty: {
        callsLlm: false,
        autoPromptResearchLab: false,
      },
      note: 'Preview only — does not call an LLM.',
    };
  }

  private scanFindings(body: string): Finding[] {
    const findings: Finding[] = [];
    const chars = [...body].length;
    if (!body.trim()) {
      findings.push({ id: 'empty', severity: 'error', message: 'Prompt body is empty' });
    }
    if (chars < 20) {
      findings.push({
        id: 'too-short',
        severity: 'warn',
        message: 'Prompt is very short (<20 chars); may lack instruction clarity',
      });
    }
    if (chars > 12_000) {
      findings.push({
        id: 'too-long',
        severity: 'warn',
        message: 'Prompt is very long (>12000 chars); consider trimming',
      });
    }
    if (body !== body.trim()) {
      findings.push({
        id: 'whitespace',
        severity: 'info',
        message: 'Leading/trailing whitespace present',
      });
    }
    for (const p of INJECTION_PATTERNS) {
      if (p.re.test(body)) {
        findings.push({ id: p.id, severity: 'warn', message: p.message });
      }
    }
    for (const p of SECRET_PATTERNS) {
      if (p.re.test(body)) {
        findings.push({ id: p.id, severity: 'error', message: p.message });
      }
    }
    return findings;
  }

  private score(findings: Finding[]): number {
    let score = 1;
    for (const f of findings) {
      if (f.severity === 'error') score -= 0.35;
      else if (f.severity === 'warn') score -= 0.12;
      else score -= 0.03;
    }
    return Math.max(0, Math.min(1, Number(score.toFixed(2))));
  }

  async evaluate(
    input: AuthCtx & { key?: string; body?: string; version?: number },
  ) {
    const key = this.requireKey(input.key);
    const resolved = await this.resolveBody({ ...input, key });
    const findings = this.scanFindings(resolved.body);
    const score = this.score(findings);
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_intelligence.evaluated',
      route: 'POST /v1/prompt-intelligence/evaluate',
      ip: input.ip,
      metadata: { key, score, findingCount: findings.length },
    });
    return {
      key,
      source: resolved.source,
      version: resolved.version,
      chars: [...resolved.body].length,
      score,
      findings,
      honesty: {
        llmAsJudgeEvalLab: false,
        autoPromptResearchLab: false,
        heuristicOnly: true,
      },
      note: 'Heuristic evaluation only — not an LLM-as-judge lab.',
    };
  }

  async securityScan(
    input: AuthCtx & { key?: string; body?: string; version?: number },
  ) {
    const key = this.requireKey(input.key);
    const resolved = await this.resolveBody({ ...input, key });
    const findings = this.scanFindings(resolved.body).filter(
      (f) =>
        INJECTION_PATTERNS.some((p) => p.id === f.id) ||
        SECRET_PATTERNS.some((p) => p.id === f.id),
    );
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_intelligence.security_scanned',
      route: 'POST /v1/prompt-intelligence/security-scan',
      ip: input.ip,
      metadata: { key, findingCount: findings.length },
    });
    return {
      key,
      source: resolved.source,
      version: resolved.version,
      findings,
      ok: findings.filter((f) => f.severity === 'error').length === 0,
      honesty: {
        redTeamHarnessOs: false,
        patternScanOnly: true,
      },
      note: 'Pattern security scan only — not a red-team harness OS.',
    };
  }

  async marketplace(organizationId: string) {
    const listings = await this.prisma.marketplaceListing.count({
      where: { publisherOrgId: organizationId, kind: 'prompt' },
    });
    const published = await this.prisma.marketplaceListing.count({
      where: { publisherOrgId: organizationId, kind: 'prompt', status: 'published' },
    });
    return {
      kind: 'prompt',
      listings,
      published,
      api: 'GET /v1/marketplace?kind=prompt',
      console: '/marketplace',
      note: 'Prompt marketplace via existing listings.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'prompt.version_created',
      'prompt.activated',
      'prompt.fallback_restored',
      'prompt_intelligence.previewed',
      'prompt_intelligence.evaluated',
      'prompt_intelligence.security_scanned',
    ] as const;
    const counts = await Promise.all(
      actions.map(async (action) => ({
        action,
        count: await this.prisma.auditEvent.count({
          where: { organizationId, action, createdAt: { gte: start } },
        }),
      })),
    );
    const byAction = Object.fromEntries(counts.map((c) => [c.action, c.count]));
    const events = counts.reduce((sum, c) => sum + c.count, 0);
    return {
      periodStart: start.toISOString(),
      workspaceId,
      events,
      byAction,
      note: 'Prompt Intelligence analytics.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const [analytics, registry, engine] = await Promise.all([
      this.analytics(organizationId, workspaceId),
      this.registry(organizationId, workspaceId),
      Promise.resolve(this.engine()),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      periodStart: analytics.periodStart,
      events: analytics.events,
      registryKeys: registry.items.length,
      usingFallback: registry.items.filter((i) => i.usingFallback).length,
      autoPromptResearchLab: engine.honesty.autoPromptResearchLab,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      fallbackBodies: PROMPT_KEYS.map((key) => ({
        key,
        preview: defaultPromptBody(key).slice(0, 80),
      })),
      note: 'Prompt Intelligence monitoring snapshot.',
    };
  }
}
