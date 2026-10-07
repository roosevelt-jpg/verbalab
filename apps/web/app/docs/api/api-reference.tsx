'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import { API_URL } from '@/lib/api';
import {
  authLabels,
  buildQuery,
  curlFor,
  exampleFor,
  fillPath,
  listEndpoints,
  requestContentType,
  requestExample,
  resolveRef,
  schemaType,
  type Endpoint,
  type OpenApiDoc,
  type Schema,
} from './openapi-helpers';
import './api-reference.css';

const SPEC_URL = `${API_URL}/v1/openapi.json`;
const SEARCH_LIMIT = 150;
const POPULAR = [
  'post /v1/translate',
  'post /v1/audio/speech',
  'post /v1/audio/transcriptions',
  'post /v1/detect',
  'post /v1/chat/completions',
  'get /v1/languages',
];

type TryResult =
  | { kind: 'text'; status: number; ms: number; contentType: string; body: string }
  | { kind: 'blob'; status: number; ms: number; contentType: string; url: string; size: number }
  | { kind: 'error'; message: string };

function MethodBadge({ method }: { method: string }) {
  return <span className={`apiref-method apiref-method--${method}`}>{method.toUpperCase()}</span>;
}

function matches(endpoint: Endpoint, needle: string): boolean {
  const hay = `${endpoint.method} ${endpoint.path} ${endpoint.op.summary ?? ''} ${endpoint.tag} ${endpoint.id}`.toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function ApiReference() {
  const [doc, setDoc] = useState<OpenApiDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openTags, setOpenTags] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(SPEC_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDoc((await res.json()) as OpenApiDoc);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Network error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const endpoints = useMemo(() => (doc ? listEndpoints(doc) : []), [doc]);
  const byId = useMemo(() => new Map(endpoints.map((e) => [e.id, e])), [endpoints]);
  const tags = useMemo(() => {
    const groups = new Map<string, Endpoint[]>();
    for (const e of endpoints) groups.set(e.tag, [...(groups.get(e.tag) ?? []), e]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [endpoints]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const endpoint = id ? byId.get(id) : undefined;
      if (endpoint) setOpenTags((prev) => new Set(prev).add(endpoint.tag));
      window.history.replaceState(null, '', id ? `#${encodeURIComponent(id)}` : window.location.pathname);
      document.getElementById('apiref-main')?.scrollTo({ top: 0 });
    },
    [byId],
  );

  useEffect(() => {
    if (!endpoints.length) return;
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (id && byId.has(id)) {
        setSelectedId(id);
        setOpenTags((prev) => new Set(prev).add(byId.get(id)!.tag));
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [endpoints, byId]);

  const results = useMemo(
    () => (query.trim() ? endpoints.filter((e) => matches(e, query)).slice(0, SEARCH_LIMIT + 1) : []),
    [endpoints, query],
  );
  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const servers = useMemo(() => {
    const urls = [API_URL, ...(doc?.servers ?? []).map((s) => s.url)].map((u) => u.replace(/\/+$/, ''));
    return [...new Set(urls)];
  }, [doc]);

  function toggleTag(tag: string) {
    setOpenTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className="apiref">
      <header className="apiref-header">
        <BrandMark href="/" />
        <nav className="apiref-header-links" aria-label="Developer links">
          <Link href="/docs">Guides</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/keys">API keys</Link>
          <Link href="/developers">Developers</Link>
          <a href={SPEC_URL} className="vl-btn vl-btn-secondary" download="lugemi-openapi.json">
            Download openapi.json
          </a>
        </nav>
      </header>

      {loadError ? (
        <section className="apiref-state" role="alert">
          <h1>Could not load the API reference</h1>
          <p>
            The OpenAPI document at <code className="vl-code">{SPEC_URL}</code> did not respond ({loadError}).
          </p>
          <button type="button" className="vl-btn vl-btn-primary" onClick={() => void load()}>
            Try again
          </button>
        </section>
      ) : !doc ? (
        <section className="apiref-state" aria-busy="true">
          <p>Loading the Lugemi API reference…</p>
        </section>
      ) : (
        <div className="apiref-layout">
          <aside className="apiref-sidebar" aria-label="Endpoints">
            <input
              type="search"
              className="vl-input apiref-search"
              placeholder={`Search ${endpoints.length.toLocaleString()} endpoints`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search endpoints"
            />
            <button
              type="button"
              className={`apiref-overview-link${selected ? '' : ' is-active'}`}
              onClick={() => select(null)}
            >
              Overview
            </button>
            {query.trim() ? (
              <div className="apiref-results">
                {results.length === 0 ? <p className="apiref-muted">No endpoints match “{query}”.</p> : null}
                <ul>
                  {results.slice(0, SEARCH_LIMIT).map((e) => (
                    <li key={e.id}>
                      <EndpointLink endpoint={e} active={e.id === selectedId} onSelect={select} showTag />
                    </li>
                  ))}
                </ul>
                {results.length > SEARCH_LIMIT ? (
                  <p className="apiref-muted">Showing the first {SEARCH_LIMIT}. Add words to narrow the search.</p>
                ) : null}
              </div>
            ) : (
              <ul className="apiref-tags">
                {tags.map(([tag, list]) => {
                  const open = openTags.has(tag);
                  return (
                    <li key={tag}>
                      <button type="button" className="apiref-tag" aria-expanded={open} onClick={() => toggleTag(tag)}>
                        <span>{tag}</span>
                        <span className="apiref-count">{list.length}</span>
                      </button>
                      {open ? (
                        <ul>
                          {list.map((e) => (
                            <li key={e.id}>
                              <EndpointLink endpoint={e} active={e.id === selectedId} onSelect={select} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <main id="apiref-main" className="apiref-main">
            {selected ? (
              <OperationView key={selected.id} doc={doc} endpoint={selected} servers={servers} />
            ) : (
              <Overview doc={doc} endpoints={endpoints} tagCount={tags.length} onSelect={select} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function EndpointLink({
  endpoint,
  active,
  onSelect,
  showTag,
}: {
  endpoint: Endpoint;
  active: boolean;
  onSelect: (id: string) => void;
  showTag?: boolean;
}) {
  return (
    <button
      type="button"
      className={`apiref-endpoint${active ? ' is-active' : ''}`}
      onClick={() => onSelect(endpoint.id)}
      title={endpoint.op.summary}
    >
      <MethodBadge method={endpoint.method} />
      <span className="apiref-endpoint-path">{endpoint.path.replace(/^\/v1/, '')}</span>
      {showTag ? <span className="apiref-endpoint-tag">{endpoint.tag}</span> : null}
    </button>
  );
}

function Overview({
  doc,
  endpoints,
  tagCount,
  onSelect,
}: {
  doc: OpenApiDoc;
  endpoints: Endpoint[];
  tagCount: number;
  onSelect: (id: string) => void;
}) {
  const server = doc.servers?.[0]?.url ?? API_URL;
  const popular = POPULAR.map((key) => endpoints.find((e) => `${e.method} ${e.path}` === key)).filter(
    (e): e is Endpoint => Boolean(e),
  );
  const quickstart = `curl -X POST ${server}/v1/translate \\
  -H "Authorization: Bearer $LUGEMI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Hello","source":"en","target":"ak"}'`;

  return (
    <article className="apiref-article">
      <p className="vl-tag">API reference · v{doc.info.version}</p>
      <h1>{doc.info.title}</h1>
      <p className="apiref-lead">{doc.info.description}</p>
      <dl className="apiref-facts">
        <div>
          <dt>Base URL</dt>
          <dd>
            <code className="vl-code">{server}</code>
          </dd>
        </div>
        <div>
          <dt>Endpoints</dt>
          <dd>{endpoints.length.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Areas</dt>
          <dd>{tagCount}</dd>
        </div>
      </dl>

      <h2>Authentication</h2>
      <p>
        Send <code className="vl-code">Authorization: Bearer &lt;key&gt;</code>. Create keys on the{' '}
        <Link href="/keys">API keys</Link> page: <code className="vl-code">lg_live_…</code> keys are for production and{' '}
        <code className="vl-code">lg_test_…</code> keys for testing. Console endpoints marked <em>Session token</em> accept
        the signed-in Lugemi session instead. Errors always return{' '}
        <code className="vl-code">{'{ "error": { "code", "message", "request_id" } }'}</code>.
      </p>
      <CodePanel code={quickstart} label="Quickstart · curl" />

      {popular.length ? (
        <>
          <h2>Popular endpoints</h2>
          <ul className="apiref-popular">
            {popular.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => onSelect(e.id)}>
                  <MethodBadge method={e.method} />
                  <span className="apiref-endpoint-path">{e.path}</span>
                  <span className="apiref-muted">{e.op.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}

function SchemaTable({ doc, schema }: { doc: OpenApiDoc; schema: Schema | undefined }) {
  const resolved = schema ? resolveRef<Schema>(doc, schema) : undefined;
  const properties = Object.entries(resolved?.properties ?? {});
  if (!properties.length) return null;
  const required = new Set(resolved?.required ?? []);
  return (
    <table className="apiref-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {properties.map(([name, prop]) => {
          const p = resolveRef<Schema>(doc, prop);
          return (
            <tr key={name}>
              <td>
                <code>{name}</code>
                {required.has(name) ? <span className="apiref-required">required</span> : null}
              </td>
              <td>
                <code>{schemaType(doc, prop)}</code>
              </td>
              <td>{p.description ?? ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OperationView({ doc, endpoint, servers }: { doc: OpenApiDoc; endpoint: Endpoint; servers: string[] }) {
  const { op, method, path, parameters } = endpoint;
  const contentType = requestContentType(op);
  const multipart = Boolean(contentType?.startsWith('multipart/'));
  const bodySchema = contentType ? op.requestBody?.content?.[contentType]?.schema : undefined;
  const resolvedBody = bodySchema ? resolveRef<Schema>(doc, bodySchema) : undefined;
  const binaryFields = Object.entries(resolvedBody?.properties ?? {})
    .filter(([, s]) => resolveRef<Schema>(doc, s).format === 'binary')
    .map(([name]) => name);
  const textFields = Object.entries(resolvedBody?.properties ?? {})
    .filter(([, s]) => resolveRef<Schema>(doc, s).format !== 'binary')
    .map(([name]) => name);
  const auth = authLabels(op);
  const adminOnly = op['x-lugemi-access'] === 'platform-admin';
  const sendsBody = Boolean(contentType) && method !== 'get' && method !== 'head';

  const [server, setServer] = useState(servers[0] ?? API_URL);
  const [credential, setCredential] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(() => requestExample(doc, op));
  const [fileField, setFileField] = useState(binaryFields[0] ?? 'file');
  const [file, setFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TryResult | null>(null);

  useEffect(
    () => () => {
      if (result?.kind === 'blob') URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const missingPath = parameters.filter((p) => p.in === 'path' && !values[p.name]?.trim()).map((p) => p.name);
  const missingQuery = parameters.filter((p) => p.in === 'query' && p.required && !values[p.name]?.trim()).map((p) => p.name);
  const curl = curlFor(doc, endpoint, server, sendsBody && !multipart ? { ...values, __body: body } : values);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const headers: Record<string, string> = {};
      if (credential.trim()) headers.Authorization = `Bearer ${credential.trim()}`;
      for (const p of parameters) {
        const value = values[p.name];
        if (p.in === 'header' && value) headers[p.name] = value;
      }
      let payload: BodyInit | undefined;
      if (sendsBody && multipart) {
        const form = new FormData();
        if (file) form.append(fileField || 'file', file);
        for (const [k, v] of Object.entries(formFields)) if (v) form.append(k, v);
        payload = form;
      } else if (sendsBody) {
        try {
          JSON.parse(body || '{}');
        } catch {
          throw new Error('The request body is not valid JSON.');
        }
        headers['Content-Type'] = contentType ?? 'application/json';
        payload = body || '{}';
      }
      const url = `${server}${fillPath(path, values)}${buildQuery(parameters, values)}`;
      const started = performance.now();
      const res = await fetch(url, { method: method.toUpperCase(), headers, body: payload });
      const ms = Math.round(performance.now() - started);
      const type = res.headers.get('content-type') ?? '';
      if (type.includes('json')) {
        const text = await res.text();
        let pretty = text;
        try {
          pretty = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          pretty = text;
        }
        setResult({ kind: 'text', status: res.status, ms, contentType: type, body: pretty });
      } else if (type.startsWith('text/') || type.includes('xml') || !type) {
        setResult({ kind: 'text', status: res.status, ms, contentType: type || 'unknown', body: await res.text() });
      } else {
        const blob = await res.blob();
        setResult({ kind: 'blob', status: res.status, ms, contentType: type, url: URL.createObjectURL(blob), size: blob.size });
      }
    } catch (err) {
      setResult({
        kind: 'error',
        message:
          err instanceof TypeError
            ? `The request did not reach ${server} (network or CORS error).`
            : err instanceof Error
              ? err.message
              : 'Request failed',
      });
    } finally {
      setSending(false);
    }
  }

  const responses = Object.entries(op.responses ?? {});

  return (
    <article className="apiref-article">
      <p className="vl-tag">{endpoint.tag}</p>
      <h1 className="apiref-op-title">{op.summary ?? `${method.toUpperCase()} ${path}`}</h1>
      <div className="apiref-op-line">
        <MethodBadge method={method} />
        <code className="apiref-op-path">{path}</code>
      </div>
      <div className="apiref-badges">
        {auth.length ? auth.map((a) => <span key={a} className="apiref-badge">{a}</span>) : <span className="apiref-badge apiref-badge--open">No authentication</span>}
        {adminOnly ? <span className="apiref-badge apiref-badge--admin">Platform admin only</span> : null}
      </div>
      {op.description ? <p className="apiref-lead">{op.description}</p> : null}

      {parameters.length ? (
        <section>
          <h2>Parameters</h2>
          <table className="apiref-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((p) => (
                <tr key={`${p.in}:${p.name}`}>
                  <td>
                    <code>{p.name}</code>
                    {p.required ? <span className="apiref-required">required</span> : null}
                  </td>
                  <td>{p.in}</td>
                  <td>
                    <code>{schemaType(doc, p.schema)}</code>
                  </td>
                  <td>{p.description ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {contentType ? (
        <section>
          <h2>Request body</h2>
          <p className="apiref-muted">
            <code>{contentType}</code>
            {op.requestBody?.required ? ' · required' : ''}
            {op.requestBody?.description ? ` · ${op.requestBody.description}` : ''}
          </p>
          <SchemaTable doc={doc} schema={bodySchema} />
        </section>
      ) : null}

      <section>
        <h2>Responses</h2>
        <ul className="apiref-responses">
          {responses.map(([code, response]) => {
            const r = resolveRef<{ description?: string; content?: Record<string, { schema?: Schema; example?: unknown }> }>(doc, response);
            const json = r.content?.['application/json'];
            const example = json?.example ?? exampleFor(doc, json?.schema);
            return (
              <li key={code}>
                <details>
                  <summary>
                    <span className={`apiref-status apiref-status--${code.charAt(0)}`}>{code}</span>
                    {r.description ?? ''}
                    {r.content && !json ? <span className="apiref-muted"> · {Object.keys(r.content).join(', ')}</span> : null}
                  </summary>
                  {example !== undefined && Object.keys(example as object).length !== 0 ? (
                    <pre className="apiref-pre">{JSON.stringify(example, null, 2)}</pre>
                  ) : (
                    <p className="apiref-muted">No body example documented.</p>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Example</h2>
        <CodePanel code={curl} label="curl" />
      </section>

      <section className="apiref-try" aria-labelledby="apiref-try-title">
        <h2 id="apiref-try-title">Try it</h2>
        <p className="apiref-muted">
          Sends a real request from your browser. Your key is only kept on this page and is never stored.
        </p>
        <div className="apiref-try-grid">
          <label>
            <span>Server</span>
            <select className="vl-input" value={server} onChange={(e) => setServer(e.target.value)}>
              {servers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {auth.length ? (
            <label>
              <span>{auth.join(' or ')}</span>
              <input
                className="vl-input"
                type="password"
                autoComplete="off"
                placeholder="lg_test_…"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
              />
            </label>
          ) : null}
          {parameters.map((p) => (
            <label key={`${p.in}:${p.name}`}>
              <span>
                {p.name} <em>({p.in}{p.required || p.in === 'path' ? ', required' : ''})</em>
              </span>
              <input
                className="vl-input"
                value={values[p.name] ?? ''}
                placeholder={String(p.example ?? exampleFor(doc, p.schema) ?? '')}
                onChange={(e) => setValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
              />
            </label>
          ))}
        </div>

        {sendsBody && multipart ? (
          <div className="apiref-try-grid">
            <label>
              <span>File field name</span>
              <input className="vl-input" value={fileField} onChange={(e) => setFileField(e.target.value)} />
            </label>
            <label>
              <span>File</span>
              <input className="vl-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {textFields.map((name) => (
              <label key={name}>
                <span>{name}</span>
                <input
                  className="vl-input"
                  value={formFields[name] ?? ''}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, [name]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        ) : null}

        {sendsBody && !multipart ? (
          <label className="apiref-body-input">
            <span>Request body (JSON)</span>
            <textarea className="vl-input" rows={Math.min(16, Math.max(4, body.split('\n').length))} value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} />
          </label>
        ) : null}

        <div className="apiref-try-actions">
          <button
            type="button"
            className="vl-btn vl-btn-primary"
            disabled={sending || missingPath.length > 0 || missingQuery.length > 0}
            onClick={() => void send()}
          >
            {sending ? 'Sending…' : `Send ${method.toUpperCase()} request`}
          </button>
          {missingPath.length || missingQuery.length ? (
            <span className="apiref-muted">Fill in {[...missingPath, ...missingQuery].join(', ')} first.</span>
          ) : null}
        </div>

        {result ? (
          <div className="apiref-result" aria-live="polite">
            {result.kind === 'error' ? (
              <p className="apiref-error">{result.message}</p>
            ) : (
              <>
                <p className="apiref-result-meta">
                  <span className={`apiref-status apiref-status--${String(result.status).charAt(0)}`}>{result.status}</span>
                  {result.ms} ms · {result.contentType}
                </p>
                {result.kind === 'text' ? (
                  <pre className="apiref-pre">{result.body || '(empty body)'}</pre>
                ) : result.contentType.startsWith('audio/') ? (
                  <audio controls src={result.url} />
                ) : (
                  <a href={result.url} download className="vl-btn">
                    Download response ({result.size.toLocaleString()} bytes)
                  </a>
                )}
              </>
            )}
          </div>
        ) : null}
      </section>
    </article>
  );
}
