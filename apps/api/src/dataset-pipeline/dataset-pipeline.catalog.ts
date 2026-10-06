/**
 * Library Phase 149 → Dataset Pipeline (VL-282).
 * Extends dataset marketplace / VL-101 — does not regenerate Dataset Cloud OS.
 */
export function datasetPipelineEngineCatalog() {
  return {
    product: 'VerbaLab Dataset Pipeline',
    capabilities: [
      { id: 'validation', name: 'Validation', status: 'shipped', notes: 'Schema and quality checks.' },
      { id: 'cleaning', name: 'Cleaning', status: 'shipped', notes: 'Normalize/clean raw rows.' },
      { id: 'normalization', name: 'Normalization', status: 'shipped', notes: 'Canonical field forms.' },
      { id: 'dedup', name: 'Deduplication', status: 'shipped', notes: 'Near-duplicate collapse.' },
      { id: 'pii', name: 'PII Handling', status: 'shipped', notes: 'Redact/flag PII before train.' },
      { id: 'annotation', name: 'Annotation', status: 'shipped', notes: 'Label workflow catalog.' },
      { id: 'versioning', name: 'Versioning', status: 'shipped', notes: 'Immutable dataset versions.' },
      { id: 'quality', name: 'Quality Gates', status: 'shipped', notes: 'Approval-ready quality scores.' },
      { id: 'approval', name: 'Approval', status: 'shipped', notes: 'Human approval before publish.' },
      { id: 'lineage', name: 'Lineage', status: 'shipped', notes: 'Source→version lineage graph seed.' },
      { id: 'dataset-cards', name: 'Dataset Cards', status: 'shipped', notes: 'Cards for consumers.' },
    ],
    pipelineRuns: [
      {
        id: 'dp-run-001',
        name: 'Afrikaans QA clean+dedup',
        stage: 'approval',
        version: 'v1.2.0',
        qualityScore: 0.94,
        piiCleared: true,
        notes: 'Extends marketplace dataset kind — not Label Studio OS.',
      },
      {
        id: 'dp-run-002',
        name: 'Swahili ASR normalize',
        stage: 'quality',
        version: 'v0.9.1',
        qualityScore: 0.88,
        piiCleared: true,
        notes: 'Normalization + quality gate pending approval.',
      },
      {
        id: 'dp-run-003',
        name: 'Prompt feedback corpus',
        stage: 'pii',
        version: 'v0.3.0',
        qualityScore: 0.71,
        piiCleared: false,
        notes: 'PII scan in progress before Continuous Learning may use.',
      },
    ],
    honesty: {
      regeneratesDatasetMarketplace: false,
      regeneratesVl101: false,
      labelStudioOs: false,
      datasetCloudOs: false,
      extendsDatasetMarketplace: true,
    },
    safety: {
      piiHandlingRequired: true,
      approvalBeforePublish: true,
      note: 'PII must clear before training/feedback use.',
    },
    docs: '/docs/DATASET_PIPELINE.md',
    note: 'Dataset Pipeline (VL-282). Validation/cleaning/normalization/dedup/PII/annotation/versioning/quality/approval/lineage/cards.',
  };
}
