import { Injectable } from '@nestjs/common';
import {
  africanKnowledgeGraphEngineCatalog,
  africanKnowledgeGraphSeed,
} from './african-knowledge-graph.catalog';

@Injectable
export class AfricanKnowledgeGraphService {
  engine {
    return africanKnowledgeGraphEngineCatalog;
  }

  nodes(kind?: string) {
    const { nodes } = africanKnowledgeGraphSeed;
    const filtered = kind ? nodes.filter((n) => n.kind === kind) : nodes;
    return {
      nodes: filtered,
      count: filtered.length,
      honesty: this.engine.honesty,
      neo4jOs: false,
    };
  }

  edges(rel?: string) {
    const { edges } = africanKnowledgeGraphSeed;
    const filtered = rel ? edges.filter((e) => e.rel === rel) : edges;
    return {
      edges: filtered,
      count: filtered.length,
      honesty: this.engine.honesty,
      neo4jOs: false,
    };
  }

  query(opts?: { kind?: string; q?: string }) {
    const { nodes, edges } = africanKnowledgeGraphSeed;
    const q = (opts?.q ?? '').trim.toLowerCase;
    let filtered = nodes;
    if (opts?.kind) filtered = filtered.filter((n) => n.kind === opts.kind);
    if (q) {
      filtered = filtered.filter(
        (n) => n.label.toLowerCase.includes(q) || n.id.toLowerCase.includes(q),
      );
    }
    const ids = new Set(filtered.map((n) => n.id));
    const relatedEdges = edges.filter((e) => ids.has(e.from) || ids.has(e.to));
    return {
      nodes: filtered,
      edges: relatedEdges,
      count: filtered.length,
      honesty: this.engine.honesty,
      neo4jOs: false,
      note: 'In-process graph query — not Neo4j Cypher.',
    };
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'graph',
      stats: catalog.stats,
      honesty: catalog.honesty,
      note: 'African Knowledge Graph monitoring snapshot.',
    };
  }
}
