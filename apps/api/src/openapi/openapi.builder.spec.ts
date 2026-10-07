import { Controller, Get, Module, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { buildOpenApiDocument, openApiServers, PRODUCTION_API_URL, tagForPath } from './openapi.builder';
import { OpenApiController } from './openapi.controller';
import { OpenApiModule } from './openapi.module';
import { discoverRoutes, HTTP_METHODS, toOpenApiPath } from './openapi.routes';

@Controller('v1/probe-widgets')
class ProbeController {
  @Get(':id')
  get(@Query('expand') _expand?: string) {
    return {};
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

const routes = discoverRoutes(AppModule);
const doc = buildOpenApiDocument(routes, { NODE_ENV: 'production' } as NodeJS.ProcessEnv);

type Op = {
  operationId?: string;
  tags?: string[];
  security?: unknown[];
  parameters?: Array<{ name: string; in: string }>;
  requestBody?: { content?: Record<string, unknown> };
  responses?: Record<string, { content?: Record<string, unknown> }>;
  'x-lugemi-access'?: string;
};

function operations(): Array<{ method: string; path: string; op: Op; pathParams: Array<{ name: string; in: string }> }> {
  const out: Array<{ method: string; path: string; op: Op; pathParams: Array<{ name: string; in: string }> }> = [];
  for (const [path, item] of Object.entries(doc.paths) as Array<[string, Record<string, unknown>]>) {
    for (const method of HTTP_METHODS) {
      const op = item[method] as Op | undefined;
      if (op) out.push({ method, path, op, pathParams: (item.parameters ?? []) as Array<{ name: string; in: string }> });
    }
  }
  return out;
}

function op(method: string, path: string): Op {
  const found = (doc.paths[path] as Record<string, Op> | undefined)?.[method];
  if (!found) throw new Error(`${method.toUpperCase()} ${path} is not documented`);
  return found;
}

describe('OpenAPI document', () => {
  it('documents exactly the routes the API serves', () => {
    const live = new Set(routes.map((r) => `${r.method} ${r.path}`));
    const documented = new Set(operations().map((o) => `${o.method} ${o.path}`));
    expect([...live].filter((k) => !documented.has(k))).toEqual([]);
    expect([...documented].filter((k) => !live.has(k))).toEqual([]);
    expect(live.size).toBeGreaterThan(1000);
  });

  it('points clients at the production API, never localhost, in production', () => {
    expect(doc.servers).toEqual([{ url: PRODUCTION_API_URL, description: 'Production' }]);
    expect(openApiServers({ NODE_ENV: 'production', API_PUBLIC_URL: 'http://127.0.0.1:3001' } as NodeJS.ProcessEnv)).toEqual([
      { url: PRODUCTION_API_URL, description: 'Production' },
    ]);
    expect(openApiServers({ NODE_ENV: 'production', API_PUBLIC_URL: 'https://api-eu.lugemi.com/' } as NodeJS.ProcessEnv)[0].url).toBe(
      'https://api-eu.lugemi.com',
    );
    const dev = openApiServers({ NODE_ENV: 'development', PORT: '4000' } as NodeJS.ProcessEnv);
    expect(dev.map((s) => s.url)).toEqual([PRODUCTION_API_URL, 'http://localhost:4000']);
  });

  it('is structurally valid: unique operation ids, tags, responses, declared path parameters', () => {
    const ids = new Set<string>();
    for (const { method, path, op: o, pathParams } of operations()) {
      const label = `${method.toUpperCase()} ${path}`;
      expect(o.operationId, label).toBeTruthy();
      expect(ids.has(o.operationId!), `duplicate operationId ${o.operationId}`).toBe(false);
      ids.add(o.operationId!);
      expect(o.tags?.length, label).toBeGreaterThan(0);
      expect(Object.keys(o.responses ?? {}).length, label).toBeGreaterThan(0);
      const declared = new Set([...pathParams, ...(o.parameters ?? [])].filter((p) => p.in === 'path').map((p) => p.name));
      for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) expect(declared.has(name), `${label} declares {${name}}`).toBe(true);
    }
    const tagNames = doc.tags.map((t) => t.name);
    expect(new Set(tagNames).size).toBe(tagNames.length);
  });

  it('resolves every $ref inside the document', () => {
    const missing: string[] = [];
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (key === '$ref' && typeof value === 'string') {
          const target = value
            .replace(/^#\//, '')
            .split('/')
            .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], doc);
          if (target === undefined) missing.push(value);
        } else walk(value);
      }
    };
    walk(doc.paths);
    expect([...new Set(missing)]).toEqual([]);
  });

  it('derives authentication from route guards', () => {
    for (const route of routes) {
      const o = op(route.method, route.path);
      if (route.guards.includes('TranslateAuthGuard')) expect(o.security).toEqual([{ ApiKeyAuth: [] }, { ClerkAuth: [] }]);
      if (route.guards.includes('PlatformAdminGuard')) {
        expect(o.security).toEqual([{ ClerkAuth: [] }]);
        expect(o['x-lugemi-access']).toBe('platform-admin');
      }
    }
  });

  it('describes generated operations from handler metadata', () => {
    const upload = op('post', '/v1/voice-data/session/{token}/recordings');
    expect(Object.keys(upload.requestBody?.content ?? {})).toEqual(['multipart/form-data']);

    const speech = op('post', '/v1/demo/speech');
    expect(speech.responses?.['201']?.content).toHaveProperty('application/octet-stream');

    const pilot = op('post', '/v1/pilot-requests');
    expect(pilot.responses).toHaveProperty('201');
    expect(pilot.security).toBeUndefined();

    const recordings = op('get', '/v1/admin/voice-data/recordings');
    expect(recordings.parameters?.map((p) => p.name).sort()).toEqual(['dialect', 'speakerId', 'status']);
    expect(recordings.tags).toEqual(['Admin · Voice data']);
  });

  it('serves the document from the live Nest controller registry', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [OpenApiModule, ProbeModule] }).compile();
    const served = moduleRef.get(OpenApiController).getOpenApi();
    const probe = (served.paths['/v1/probe-widgets/{id}'] as Record<string, Op> | undefined)?.get;
    expect(probe?.parameters?.map((p) => `${p.in}:${p.name}`)).toEqual(['path:id', 'query:expand']);
    expect(served.paths['/v1/openapi.json']).toBeDefined();
    expect(served.paths['/v1/translate']).toBeUndefined();
    await moduleRef.close();
  });

  it('normalizes Express paths and tags', () => {
    expect(toOpenApiPath('v1/languages', ':code')).toBe('/v1/languages/{code}');
    expect(toOpenApiPath('/v1/files/', '*')).toBe('/v1/files/{path}');
    expect(tagForPath('/v1/neural-tts/voices')).toBe('Neural TTS');
    expect(tagForPath('/v1/agentops-platform/runs')).toBe('AgentOps platform');
    expect(tagForPath('/health')).toBe('System');
  });
});
