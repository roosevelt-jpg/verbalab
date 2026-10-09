'use client';

import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import './localize.css';

type LocalizeFormat = 'json' | 'yaml';

type LocalizeResult = {
  format: LocalizeFormat;
  content: unknown;
  serialized: string;
  strings: number;
  translated: number;
  tmHits: number;
  glossaryApplied: number;
  error?: { message: string };
};

const MAX_PREVIEW_CHARS = 200_000;
const ACCEPTED_EXT = ['.json', '.yaml', '.yml'] as const;

function detectFormatFromName(name: string): LocalizeFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  return null;
}

function isAcceptedFile(file: File): boolean {
  const byName = detectFormatFromName(file.name);
  if (byName) return true;
  const type = file.type.toLowerCase();
  return (
    type === 'application/json' ||
    type === 'text/json' ||
    type === 'application/x-yaml' ||
    type === 'text/yaml' ||
    type === 'text/x-yaml'
  );
}

function JsonTree({ value, name }: { value: unknown; name?: string }): ReactNode {
  if (value === null) {
    return (
      <div>
        {name ? <span className="lg-localize-key">{name}: </span> : null}
        <span className="lg-localize-null">null</span>
      </div>
    );
  }
  if (typeof value === 'string') {
    return (
      <div>
        {name ? <span className="lg-localize-key">{name}: </span> : null}
        <span className="lg-localize-str">&quot;{value}&quot;</span>
      </div>
    );
  }
  if (typeof value === 'number') {
    return (
      <div>
        {name ? <span className="lg-localize-key">{name}: </span> : null}
        <span className="lg-localize-num">{value}</span>
      </div>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <div>
        {name ? <span className="lg-localize-key">{name}: </span> : null}
        <span className="lg-localize-bool">{String(value)}</span>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <details open={value.length <= 12}>
        <summary>
          {name ? <span className="lg-localize-key">{name}</span> : 'array'}{' '}
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>[{value.length}]</span>
        </summary>
        {value.map((item, i) => (
          <JsonTree key={i} value={item} name={String(i)} />
        ))}
      </details>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <details open={entries.length <= 12}>
        <summary>
          {name ? <span className="lg-localize-key">{name}</span> : 'object'}{' '}
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{`{${entries.length}}`}</span>
        </summary>
        {entries.map(([key, child]) => (
          <JsonTree key={key} value={child} name={key} />
        ))}
      </details>
    );
  }
  return (
    <div>
      {name ? <span className="lg-localize-key">{name}: </span> : null}
      {String(value)}
    </div>
  );
}

function PreviewPanel({
  title,
  format,
  parsed,
  serialized,
  stats,
}: {
  title: string;
  format: LocalizeFormat;
  parsed: unknown | null;
  serialized: string;
  stats?: { strings?: number; translated?: number; tmHits?: number };
}) {
  const [mode, setMode] = useState<'tree' | 'raw'>('tree');
  const tooLarge = serialized.length > MAX_PREVIEW_CHARS;
  const showTree = format === 'json' && parsed != null && !tooLarge && mode === 'tree';

  return (
    <section className="vl-panel lg-localize-preview vl-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2>{title}</h2>
        <div className="lg-localize-actions">
          {format === 'json' && parsed != null && !tooLarge ? (
            <>
              <button
                type="button"
                className={`vl-btn vl-btn-secondary${mode === 'tree' ? ' is-pressed' : ''}`}
                style={{ minHeight: 36, padding: '0.35rem 0.75rem' }}
                onClick={() => setMode('tree')}
              >
                Tree
              </button>
              <button
                type="button"
                className={`vl-btn vl-btn-secondary${mode === 'raw' ? ' is-pressed' : ''}`}
                style={{ minHeight: 36, padding: '0.35rem 0.75rem' }}
                onClick={() => setMode('raw')}
              >
                Raw
              </button>
            </>
          ) : null}
        </div>
      </div>
      {stats ? (
        <div className="lg-localize-preview-meta">
          {typeof stats.strings === 'number' ? <span className="vl-tag">{stats.strings} strings</span> : null}
          {typeof stats.translated === 'number' ? (
            <span className="vl-tag">{stats.translated} translated</span>
          ) : null}
          {typeof stats.tmHits === 'number' ? <span className="vl-tag">{stats.tmHits} TM hits</span> : null}
          <span className="vl-tag">{format.toUpperCase()}</span>
        </div>
      ) : (
        <div className="lg-localize-preview-meta">
          <span className="vl-tag">{format.toUpperCase()}</span>
        </div>
      )}
      {showTree ? (
        <div className="lg-localize-tree" role="region" aria-label={`${title} tree`}>
          <JsonTree value={parsed} />
        </div>
      ) : (
        <pre className="lg-localize-tree" role="region" aria-label={`${title} raw`}>
          {tooLarge
            ? `${serialized.slice(0, MAX_PREVIEW_CHARS)}\n… truncated for preview (${serialized.length.toLocaleString()} chars)`
            : serialized}
        </pre>
      )}
    </section>
  );
}

export function LocalizeClient() {
  const catalog = useLocaleCatalog();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiKey, setApiKey] = useState('');
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [format, setFormat] = useState<LocalizeFormat>('json');
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState('');
  const [parsedInput, setParsedInput] = useState<unknown | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocalizeResult | null>(null);

  const clearFile = useCallback(() => {
    setFile(null);
    setFileText('');
    setParsedInput(null);
    setValidation(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const ingestFile = useCallback(async (next: File) => {
    setError(null);
    setResult(null);
    setValidation(null);

    if (!isAcceptedFile(next)) {
      setValidation('Only .json, .yaml, or .yml files are accepted.');
      clearFile();
      return;
    }

    const detected = detectFormatFromName(next.name) ?? (next.type.includes('yaml') ? 'yaml' : 'json');
    setFormat(detected);
    setFile(next);

    try {
      const text = await next.text();
      if (!text.trim()) {
        setValidation('The file is empty.');
        setFileText('');
        setParsedInput(null);
        return;
      }
      setFileText(text);
      if (detected === 'json') {
        const parsed = JSON.parse(text) as unknown;
        if (parsed === null || typeof parsed !== 'object') {
          setValidation('JSON must be an object or array of i18n strings.');
          setParsedInput(null);
          return;
        }
        setParsedInput(parsed);
        setValidation(`Valid JSON · ${next.name} · ${(next.size / 1024).toFixed(1)} KB`);
      } else {
        setParsedInput(null);
        setValidation(`YAML loaded · ${next.name} · ${(next.size / 1024).toFixed(1)} KB`);
      }
    } catch (err) {
      setParsedInput(null);
      setFileText('');
      setValidation(err instanceof Error ? err.message : 'Could not read or parse the file.');
    }
  }, [clearFile]);

  const ingestPaste = useCallback(() => {
    setError(null);
    setResult(null);
    const text = pasteText.trim();
    if (!text) {
      setValidation('Paste JSON or YAML content, or upload a file.');
      return;
    }
    clearFile();
    setFileText(text);
    if (format === 'json') {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed === null || typeof parsed !== 'object') {
          setValidation('JSON must be an object or array of i18n strings.');
          setParsedInput(null);
          return;
        }
        setParsedInput(parsed);
        setValidation('Valid pasted JSON');
      } catch (err) {
        setParsedInput(null);
        setValidation(err instanceof Error ? err.message : 'Invalid JSON');
      }
    } else {
      setParsedInput(null);
      setValidation('YAML paste ready to localize');
    }
  }, [clearFile, format, pasteText]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!apiKey.startsWith('lg_live_')) {
      setError('Paste a lg_live_ API key');
      return;
    }
    if (!file && !fileText.trim()) {
      setError('Upload a JSON/YAML file or paste content first.');
      return;
    }
    if (format === 'json' && fileText.trim()) {
      try {
        const parsed = JSON.parse(fileText) as unknown;
        if (parsed === null || typeof parsed !== 'object') {
          setError('JSON must be an object or array.');
          return;
        }
      } catch {
        setError('Fix invalid JSON before submitting.');
        return;
      }
    }

    setLoading(true);
    try {
      let body: LocalizeResult;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('source', source);
        form.append('target', target);
        form.append('format', format);
        const res = await fetch(`${API_URL}/v1/localize/file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        body = (await res.json()) as LocalizeResult;
        if (!res.ok) throw new Error(body.error?.message ?? `Localize failed (${res.status})`);
      } else {
        let content: unknown = fileText;
        if (format === 'json') {
          content = JSON.parse(fileText) as unknown;
        }
        const res = await fetch(`${API_URL}/v1/localize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ format, source, target, content }),
        });
        body = (await res.json()) as LocalizeResult;
        if (!res.ok) throw new Error(body.error?.message ?? `Localize failed (${res.status})`);
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Localize failed');
    } finally {
      setLoading(false);
    }
  }

  function onDropZoneKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  const hasInput = Boolean(file || fileText.trim());
  const inputPreviewSerialized =
    format === 'json' && parsedInput != null
      ? `${JSON.stringify(parsedInput, null, 2)}\n`
      : fileText;

  return (
    <AppShell>
      <div className="lg-localize">
        <header className="lg-localize-head vl-fade-up">
          <h1>Localize</h1>
          <p>
            Upload real JSON or YAML i18n files. Keys stay intact, ICU placeholders pass through, and
            results come back as a structured preview.{' '}
            <Link href="/localization">Localization tools</Link> · <Link href="/locales">Locale packs</Link>
          </p>
        </header>

        <form onSubmit={onSubmit} className="vl-panel lg-localize-form vl-fade-up-delay">
          <label className="vl-label">
            API key
            <input
              className="vl-field vl-code"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="lg_live_..."
              autoComplete="off"
              required
            />
          </label>

          <div className="lg-localize-row">
            <label className="vl-label">
              Source
              <LocaleSelect
                className="vl-field"
                value={source}
                onChange={setSource}
                languages={catalog.languages}
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
              />
            </label>
            <label className="vl-label">
              Target
              <LocaleSelect
                className="vl-field"
                value={target}
                onChange={setTarget}
                languages={catalog.languages}
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
              />
            </label>
          </div>

          <div
            className={`lg-localize-drop${drag ? ' is-drag' : ''}${file ? ' is-ready' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) void ingestFile(dropped);
            }}
          >
            <div
              className="lg-localize-drop-zone"
              role="button"
              tabIndex={0}
              aria-controls={inputId}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={onDropZoneKey}
            >
              <strong>{file ? file.name : 'Drop a .json or .yaml file here'}</strong>
              <span>{file ? 'Ready to localize — click to replace' : 'or click to choose a file'}</span>
            </div>
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml,application/json,application/x-yaml,text/yaml,text/x-yaml"
              hidden
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (next) void ingestFile(next);
              }}
            />
            <div className="lg-localize-drop-meta">
              <span className="vl-tag">{format.toUpperCase()}</span>
              {file ? (
                <button type="button" className="vl-btn vl-btn-secondary" style={{ minHeight: 36, padding: '0.35rem 0.75rem' }} onClick={clearFile}>
                  Clear file
                </button>
              ) : null}
            </div>
          </div>

          {validation ? (
            <p
              className={`lg-localize-status${
                validation.startsWith('Valid') || validation.includes('loaded') || validation.includes('ready')
                  ? ' is-ok'
                  : ' is-error'
              }`}
              role="status"
            >
              {validation}
            </p>
          ) : (
            <p className="lg-localize-status">No file selected yet.</p>
          )}

          <details
            className="lg-localize-paste"
            open={pasteOpen}
            onToggle={(e) => setPasteOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>Or paste JSON / YAML</summary>
            <label className="vl-label" style={{ marginTop: '0.65rem' }}>
              Format
              <select
                className="vl-field"
                value={format}
                onChange={(e) => setFormat(e.target.value as LocalizeFormat)}
              >
                <option value="json">json</option>
                <option value="yaml">yaml</option>
              </select>
            </label>
            <label className="vl-label">
              Content
              <textarea
                className="vl-field vl-code"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={format === 'json' ? '{\n  "app": { "title": "Welcome" }\n}' : 'app:\n  title: Welcome'}
                spellCheck={false}
              />
            </label>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={ingestPaste}>
              Use pasted content
            </button>
          </details>

          <div className="lg-localize-actions">
            <button type="submit" className="vl-btn vl-btn-primary" disabled={loading || !hasInput}>
              {loading ? 'Localizing…' : 'Localize'}
            </button>
            {result?.serialized ? (
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                onClick={() => {
                  const blob = new Blob([result.serialized], {
                    type: result.format === 'json' ? 'application/json' : 'application/x-yaml',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `localized.${result.format === 'json' ? 'json' : 'yaml'}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download result
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="lg-localize-status is-loading" role="status">
              Translating strings via POST /v1/localize{file ? '/file' : ''}…
            </p>
          ) : null}
          {error ? (
            <p className="lg-localize-status is-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        {!hasInput && !loading && !result ? (
          <p className="lg-localize-empty vl-fade-up">
            Upload an i18n file to see a collapsible preview here. Nothing is sent until you click Localize.
          </p>
        ) : null}

        {hasInput && inputPreviewSerialized ? (
          <PreviewPanel
            title={file ? `Input · ${file.name}` : 'Input preview'}
            format={format}
            parsed={parsedInput}
            serialized={inputPreviewSerialized}
          />
        ) : null}

        {result ? (
          <PreviewPanel
            title="Localized output"
            format={result.format}
            parsed={result.format === 'json' ? result.content : null}
            serialized={result.serialized}
            stats={{
              strings: result.strings,
              translated: result.translated,
              tmHits: result.tmHits,
            }}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
