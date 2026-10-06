/**
 * Library Phase 150 → Training Pipeline (VL-283).
 * Not Ray cluster OS, Kubeflow OS, or distributed training OS.
 */
export function trainingPipelineEngineCatalog() {
  return {
    product: 'VerbaLab Training Pipeline',
    methods: [
      { id: 'lora', name: 'LoRA', status: 'shipped', notes: 'Low-rank adaptation jobs.' },
      { id: 'qlora', name: 'QLoRA', status: 'shipped', notes: 'Quantized LoRA jobs.' },
      { id: 'dpo', name: 'DPO', status: 'shipped', notes: 'Direct preference optimization.' },
      { id: 'rlhf', name: 'RLHF', status: 'shipped', notes: 'Preference-loop catalog — not full RL lab OS.' },
      { id: 'sft', name: 'SFT', status: 'shipped', notes: 'Supervised fine-tuning.' },
      { id: 'checkpointing', name: 'Checkpointing', status: 'shipped', notes: 'Checkpoint catalog + resume plans.' },
      { id: 'gpu-scheduling', name: 'GPU Scheduling', status: 'shipped', notes: 'Queue catalog — not cluster OS.' },
    ],
    jobs: [
      {
        id: 'train-job-001',
        name: 'LoRA SFT — support agent',
        method: 'lora',
        status: 'completed',
        gpuQueue: 'spot-a10',
        checkpoint: 'ckpt-014',
        notes: 'Handoff to Continuous Evaluation before promote.',
      },
      {
        id: 'train-job-002',
        name: 'QLoRA DPO — tone preference',
        method: 'qlora',
        status: 'running',
        gpuQueue: 'ondemand-a100',
        checkpoint: 'ckpt-003',
        notes: 'Preference pairs from vetted feedback only.',
      },
      {
        id: 'train-job-003',
        name: 'SFT — RAG rewriter',
        method: 'sft',
        status: 'queued',
        gpuQueue: 'spot-a10',
        checkpoint: null,
        notes: 'Queued behind GPU schedule catalog.',
      },
    ],
    honesty: {
      distributedTrainingOs: false,
      rayClusterOs: false,
      kubeflowOs: false,
      sageMakerOs: false,
      vertexOs: false,
      regeneratesModelTrainingPlatform: false,
    },
    safety: {
      promoteRequiresContinuousLearningGates: true,
      note: 'Trained artifacts never auto-promote — Continuous Learning gates apply.',
    },
    docs: '/docs/TRAINING_PIPELINE.md',
    note: 'Training Pipeline (VL-283). LoRA/QLoRA/DPO/RLHF/SFT/checkpointing/GPU scheduling. distributedTrainingOs=false.',
  };
}
