import { openApiDocument } from './openapi.document';
import { HTTP_METHODS, type DiscoveredRoute, type HttpMethod } from './openapi.routes';

export const PRODUCTION_API_URL = 'https://api.lugemi.com';

type Json = Record<string, unknown>;
type Parameter = { name: string; in: string; required?: boolean; schema?: Json; description?: string };
type Operation = Json & {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: Json;
  responses?: Record<string, Json>;
};
type PathItem = Json & { parameters?: Parameter[] } & Partial<Record<HttpMethod, Operation>>;

export interface OpenApiDocument {
  openapi: string;
  info: Json & { title: string; version: string; description?: string };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string }>;
  components: Json;
  paths: Record<string, PathItem>;
}

const SPECIAL_WORDS: Record<string, string> = {
  ai: 'AI',
  api: 'API',
  apis: 'APIs',
  gpu: 'GPU',
  mcp: 'MCP',
  ocr: 'OCR',
  rag: 'RAG',
  sdk: 'SDK',
  stt: 'STT',
  tts: 'TTS',
  tm: 'TM',
  ui: 'UI',
  llm: 'LLM',
  vaios: 'VAIOS',
  llmops: 'LLMOps',
  mlops: 'MLOps',
  ragops: 'RAGOps',
  finops: 'FinOps',
  gitops: 'GitOps',
  promptops: 'PromptOps',
  agentops: 'AgentOps',
  graphql: 'GraphQL',
};

function humanize(slug: string): string {
  const words = slug
    .replace(/\.[a-z]+$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  return words
    .map((w, i) => SPECIAL_WORDS[w] ?? (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function tagForPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const [version, area, sub] = parts;
  if (version !== 'v1' || !area || area === 'openapi.json') return 'System';
  if (area === 'admin') return sub && !sub.startsWith('{') ? `Admin · ${humanize(sub)}` : 'Admin';
  return humanize(area);
}

function securityForGuards(guards: string[]): Operation['security'] | undefined {
  if (guards.includes('TranslateAuthGuard')) return [{ ApiKeyAuth: [] }, { ClerkAuth: [] }];
  if (guards.includes('ApiKeyGuard')) return [{ ApiKeyAuth: [] }];
  if (guards.includes('ClerkAuthGuard') || guards.includes('PlatformAdminGuard')) return [{ ClerkAuth: [] }];
  return undefined;
}

function errorResponse(description: string): Json {
  return { description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };
}

function pathParamNames(path: string): string[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].flatMap((m) => (m[1] ? [m[1]] : []));
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function upperFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generatedOperation(route: DiscoveredRoute): Operation {
  const op: Operation = {
    operationId: `${lowerFirst(route.controller.replace(/Controller$/, ''))}${upperFirst(route.handler)}`,
    summary: humanize(route.handler),
  };

  const parameters: Parameter[] = route.query.map((name) => ({ name, in: 'query', required: false, schema: { type: 'string' } }));
  if (parameters.length) op.parameters = parameters;

  if (route.body || route.file) {
    const properties: Record<string, Json> = Object.fromEntries(route.bodyFields.map((f) => [f, { type: 'string' }]));
    if (route.file) {
      op.requestBody = {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { type: 'object', properties: { ...properties }, additionalProperties: { type: 'string', format: 'binary' } },
          },
        },
      };
    } else {
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: route.bodyFields.length
              ? { type: 'object', properties, required: route.bodyFields }
              : { type: 'object', additionalProperties: true },
          },
        },
      };
    }
  }

  const success: Json = route.rawResponse
    ? {
        description: 'Success. The body is written directly by the handler (for example audio bytes or a file download).',
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
      }
    : { description: 'Success', content: { 'application/json': { schema: {} } } };
  op.responses = { [String(route.status)]: success };
  return op;
}

function addErrorResponses(op: Operation, route: DiscoveredRoute, path: string) {
  const responses = (op.responses ??= {});
  const add = (code: string, description: string) => {
    if (!responses[code]) responses[code] = errorResponse(description);
  };
  if (route.body || route.file || route.query.length || route.queryObject) add('400', 'Invalid request');
  if (op.security?.length) add('401', 'Missing or invalid credentials');
  if (route.guards.includes('PlatformAdminGuard')) add('403', 'Platform admin access required');
  if (pathParamNames(path).length) add('404', 'Not found');
  if (route.guards.includes('RateLimitGuard')) add('429', 'Rate limit exceeded');
}

function ensurePathParameters(item: PathItem, op: Operation, path: string) {
  const declared = new Set(
    [...(item.parameters ?? []), ...(op.parameters ?? [])].filter((p) => p.in === 'path').map((p) => p.name),
  );
  const missing = pathParamNames(path).filter((name) => !declared.has(name));
  if (!missing.length) return;
  op.parameters = [
    ...missing.map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } })),
    ...(op.parameters ?? []),
  ];
}

export function openApiServers(env: NodeJS.ProcessEnv = process.env): OpenApiDocument['servers'] {
  const production = env.NODE_ENV === 'production';
  const configured = (env.API_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(configured);
  const useConfigured = /^https?:\/\//i.test(configured) && !(production && isLocal);
  const publicUrl = useConfigured ? configured : PRODUCTION_API_URL;
  const servers = [{ url: publicUrl, description: useConfigured && isLocal ? 'Local development' : 'Production' }];
  if (!production && !(useConfigured && isLocal)) {
    servers.push({ url: `http://localhost:${env.PORT ?? env.API_PORT ?? 3001}`, description: 'Local development' });
  }
  return servers;
}

/**
 * The served OpenAPI document: hand-written operations from openapi.document.ts for detail,
 * plus a generated operation for every live route that is not hand-written. Paths that the
 * API no longer serves are dropped, so the document always matches the route table.
 */
export function buildOpenApiDocument(routes: DiscoveredRoute[], env: NodeJS.ProcessEnv = process.env): OpenApiDocument {
  const base = structuredClone(openApiDocument) as unknown as OpenApiDocument;
  const live = new Map(routes.map((r) => [`${r.method} ${r.path}`, r]));
  const paths: Record<string, PathItem> = {};
  const usedIds = new Set<string>();

  const place = (path: string, method: HttpMethod, op: Operation, route: DiscoveredRoute, item: PathItem) => {
    op.tags = op.tags?.length ? op.tags : [tagForPath(path)];
    op.security = securityForGuards(route.guards) ?? op.security;
    if (route.guards.includes('PlatformAdminGuard')) op['x-lugemi-access'] = 'platform-admin';
    if (!op.summary) op.summary = humanize(route.handler);
    ensurePathParameters(item, op, path);
    addErrorResponses(op, route, path);
    let id = op.operationId || `${method}${path.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))}`;
    if (usedIds.has(id)) id = `${id}_${method}`;
    for (let n = 2; usedIds.has(id); n += 1) id = `${id.replace(/_\d+$/, '')}_${n}`;
    usedIds.add(id);
    op.operationId = id;
    item[method] = op;
  };

  for (const [path, original] of Object.entries(base.paths)) {
    const pathLevel: PathItem = {};
    for (const [key, value] of Object.entries(original)) {
      if (!(HTTP_METHODS as readonly string[]).includes(key)) pathLevel[key] = value;
    }
    for (const method of HTTP_METHODS) {
      const op = original[method];
      const route = live.get(`${method} ${path}`);
      if (!op || !route) continue;
      const item = (paths[path] ??= { ...pathLevel });
      place(path, method, op, route, item);
    }
  }

  for (const route of routes) {
    const item = (paths[route.path] ??= {});
    if (item[route.method]) continue;
    place(route.path, route.method, generatedOperation(route), route, item);
  }

  const sortedPaths = Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
  const tagNames = new Set<string>();
  for (const item of Object.values(sortedPaths)) {
    for (const method of HTTP_METHODS) for (const tag of item[method]?.tags ?? []) tagNames.add(tag);
  }

  return {
    ...base,
    info: {
      ...base.info,
      description:
        'Lugemi language, speech, and voice API. This document is built from the live route table at startup, so every endpoint the API serves is listed. Authenticate with an API key (Authorization: Bearer lg_live_… or lg_test_…) or, for console routes, a Lugemi session token.',
    },
    servers: openApiServers(env),
    tags: [...tagNames].sort((a, b) => a.localeCompare(b)).map((name) => ({ name })),
    paths: sortedPaths,
  };
}
