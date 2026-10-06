/** Split text into overlapping character windows for embedding. */
export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {},
): string[] {
  const size = opts.size ?? Number(process.env.RAG_CHUNK_SIZE ?? 700);
  const overlap = opts.overlap ?? Number(process.env.RAG_CHUNK_OVERLAP ?? 80);
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim;
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + size, normalized.length);
    const slice = normalized.slice(start, end).trim;
    if (slice) chunks.push(slice);
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

export function embeddingToSql(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

export function ragTopK: number {
  const raw = Number(process.env.RAG_TOP_K ?? 5);
  if (!Number.isFinite(raw) || raw < 1) return 5;
  return Math.min(Math.floor(raw), 10);
}

export function knowledgeMaxDocs: number {
  const raw = Number(process.env.KNOWLEDGE_MAX_DOCS ?? 20);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 20;
}

export function knowledgeMaxChunks: number {
  const raw = Number(process.env.KNOWLEDGE_MAX_CHUNKS ?? 200);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 200;
}
