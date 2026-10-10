export type Schema = {
  $ref?: string;
  type?: string | string[];
  format?: string;
  description?: string;
  example?: unknown;
  examples?: unknown[];
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  nullable?: boolean;
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  required?: string[];
  items?: Schema;
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};

export type Parameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: Schema;
  example?: unknown;
};

export type MediaType = { schema?: Schema; example?: unknown };

export type Operation = {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: { required?: boolean; description?: string; content?: Record<string, MediaType> };
  responses?: Record<string, { description?: string; content?: Record<string, MediaType> }>;
  'x-lugemi-access'?: string;
};

export type OpenApiDoc = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  components?: { schemas?: Record<string, Schema>; securitySchemes?: Record<string, { description?: string }> };
  paths: Record<string, Record<string, unknown>>;
};

export type Endpoint = {
  id: string;
  method: string;
  path: string;
  tag: string;
  op: Operation;
  parameters: Parameter[];
};

export const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

export function resolveRef<T>(doc: OpenApiDoc, value: T | { $ref: string }): T {
  let current: unknown = value;
  for (let hops = 0; hops < 10 && current && typeof current === 'object' && '$ref' in current; hops += 1) {
    const ref = (current as { $ref: string }).$ref;
    current = ref
      .replace(/^#\//, '')
      .split('/')
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], doc);
  }
  return (current ?? {}) as T;
}

export function listEndpoints(doc: OpenApiDoc): Endpoint[] {
  const out: Endpoint[] = [];
  for (const [path, item] of Object.entries(doc.paths)) {
    const shared = (item.parameters ?? []) as Parameter[];
    for (const method of METHODS) {
      const op = item[method] as Operation | undefined;
      if (!op) continue;
      const own = (op.parameters ?? []).map((p) => resolveRef<Parameter>(doc, p));
      const merged = [...shared.map((p) => resolveRef<Parameter>(doc, p)).filter((p) => !own.some((o) => o.name === p.name && o.in === p.in)), ...own];
      out.push({ id: op.operationId, method, path, tag: op.tags?.[0] ?? 'Other', op, parameters: merged });
    }
  }
  return out;
}

export function schemaType(doc: OpenApiDoc, schema: Schema | undefined): string {
  if (!schema) return 'any';
  const s = resolveRef<Schema>(doc, schema);
  if (schema.$ref) return schema.$ref.split('/').pop() ?? 'object';
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(' | ');
  const type = Array.isArray(s.type) ? s.type.join(' | ') : s.type;
  if (type === 'array') return `${schemaType(doc, s.items)}[]`;
  if (s.oneOf || s.anyOf) return (s.oneOf ?? s.anyOf ?? []).map((x) => schemaType(doc, x)).join(' | ');
  return [type ?? (s.properties ? 'object' : 'any'), s.format].filter(Boolean).join(' · ');
}

export function exampleFor(doc: OpenApiDoc, schema: Schema | undefined, depth = 0): unknown {
  if (!schema || depth > 6) return undefined;
  const s = resolveRef<Schema>(doc, schema);
  if (s.example !== undefined) return s.example;
  if (s.examples?.length) return s.examples[0];
  if (s.default !== undefined) return s.default;
  if (s.const !== undefined) return s.const;
  if (s.enum?.length) return s.enum[0];
  if (s.allOf?.length) {
    return s.allOf.reduce<Record<string, unknown>>((acc, part) => {
      const value = exampleFor(doc, part, depth + 1);
      return value && typeof value === 'object' && !Array.isArray(value) ? { ...acc, ...(value as object) } : acc;
    }, {});
  }
  if (s.oneOf?.length || s.anyOf?.length) return exampleFor(doc, (s.oneOf ?? s.anyOf)![0], depth + 1);
  const type = Array.isArray(s.type) ? s.type.find((t) => t !== 'null') : s.type;
  if (type === 'object' || s.properties) {
    const out: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(s.properties ?? {})) out[key] = exampleFor(doc, prop, depth + 1) ?? null;
    return out;
  }
  if (type === 'array') {
    const item = exampleFor(doc, s.items, depth + 1);
    return item === undefined ? [] : [item];
  }
  if (type === 'integer' || type === 'number') return s.minimum ?? 0;
  if (type === 'boolean') return false;
  if (type === 'string') {
    if (s.format === 'date-time') return new Date(0).toISOString();
    if (s.format === 'date') return '1970-01-01';
    if (s.format === 'binary') return '<file>';
    if (s.format === 'uri' || s.format === 'url') return 'https://example.com';
    if (s.format === 'email') return 'you@example.com';
    return 'string';
  }
  return undefined;
}

export function requestContentType(op: Operation): string | null {
  const types = Object.keys(op.requestBody?.content ?? {});
  return types.find((t) => t.includes('json')) ?? types[0] ?? null;
}

export function requestExample(doc: OpenApiDoc, op: Operation): string {
  const type = requestContentType(op);
  if (!type || type.startsWith('multipart/')) return '';
  const media = op.requestBody?.content?.[type];
  const example = media?.example ?? exampleFor(doc, media?.schema);
  return JSON.stringify(example ?? {}, null, 2);
}

export function authLabels(op: Operation): string[] {
  const labels = new Set<string>();
  for (const requirement of op.security ?? []) {
    if ('ApiKeyAuth' in requirement) labels.add('API key');
    if ('ClerkAuth' in requirement) labels.add('Session token');
  }
  return [...labels];
}

export function fillPath(path: string, values: Record<string, string>): string {
  return path.replace(/\{([^}]+)\}/g, (_, name: string) =>
    values[name] ? encodeURIComponent(values[name]) : `{${name}}`,
  );
}

export function buildQuery(params: Parameter[], values: Record<string, string>): string {
  const search = new URLSearchParams();
  for (const p of params) {
    const value = values[p.name];
    if (p.in === 'query' && value) search.set(p.name, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function curlFor(doc: OpenApiDoc, endpoint: Endpoint, server: string, values: Record<string, string> = {}): string {
  const { op, method, parameters } = endpoint;
  const pathValues = Object.fromEntries(
    parameters.filter((p) => p.in === 'path').map((p) => [p.name, values[p.name] || `<${p.name}>`]),
  );
  const url = `${server}${endpoint.path.replace(/\{([^}]+)\}/g, (_, n: string) => pathValues[n] ?? `<${n}>`)}${buildQuery(parameters, values)}`;
  const lines = [`curl -X ${method.toUpperCase()} ${shellQuote(url)}`];
  if (op.security?.length) lines.push('  -H "Authorization: Bearer $LUGEMI_API_KEY"');
  const type = requestContentType(op);
  if (type?.startsWith('multipart/')) {
    lines.push(`  -F 'file=@/path/to/file'`);
  } else if (type) {
    lines.push(`  -H 'Content-Type: ${type}'`);
    const body = values.__body ?? requestExample(doc, op);
    let compact: string;
    try {
      compact = JSON.stringify(JSON.parse(body || '{}'));
    } catch {
      compact = body;
    }
    lines.push(`  -d ${shellQuote(compact)}`);
  }
  return lines.join(' \\\n');
}
