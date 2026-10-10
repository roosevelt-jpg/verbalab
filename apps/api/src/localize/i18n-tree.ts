export type FlatEntry = { path: string; value: string };

/** Flatten nested objects/arrays to string leaves with dotted/bracket paths. */
export function flattenStrings(value: unknown, prefix = ''): FlatEntry[] {
  if (typeof value === 'string') {
    return prefix ? [{ path: prefix, value }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenStrings(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      return flattenStrings(child, next);
    });
  }
  return [];
}

/** Set a flattened path back onto a deep-cloned structure. */
export function setAtPath(root: unknown, path: string, value: string): void {
  const tokens = tokenizePath(path);
  let cursor: unknown = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]!;
    const next = tokens[i + 1]!;
    if (typeof token === 'number') {
      cursor = (cursor as unknown[])[token];
    } else {
      cursor = (cursor as Record<string, unknown>)[token];
    }
    if (cursor == null) {
      throw new Error(`Invalid path: ${path}`);
    }
    void next;
  }
  const last = tokens[tokens.length - 1]!;
  if (typeof last === 'number') {
    (cursor as unknown[])[last] = value;
  } else {
    (cursor as Record<string, unknown>)[last] = value;
  }
}

function tokenizePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const re = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(path))) {
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) tokens.push(Number(match[2]));
  }
  return tokens;
}

export function deepCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
