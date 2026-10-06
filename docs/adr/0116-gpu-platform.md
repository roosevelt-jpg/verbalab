# ADR-0116: GPU Platform (sandbox + hard ceilings, not a hyperscaler)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-205 (library “Phase 72 GPU Platform” mapped)

## Context

Library Phase 72 asks for an Enterprise GPU Platform covering NVIDIA/AMD/Intel, pools, scheduling, quotas, autoscaling, reservations, health, monitoring, cost tracking, sharing, multi-GPU, and distributed GPU.

Volume 7 README warns that buggy autoscaling/provisioning can create a real cloud bill. Compiling + green tests are not enough before connecting to a production billing account.

Inventing a hyperscaler GPU control plane or wiring live AWS/GCP GPU APIs in this phase would violate extend-don’t-regenerate and spend-safety rules from ADR-0115.

## Decision

1. Ship `/v1/gpu-platform/*` + `/gpu-platform` console as a **sandbox logical inventory** over org/workspace-scoped `GpuAllocation` rows.
2. Support NVIDIA/AMD/Intel as **pool tags** only — no vendor cloud account wiring.
3. Enforce **hard ceilings** (`VERBALAB_GPU_MAX_INSTANCES`, `VERBALAB_GPU_MAX_SPEND_USD`) on allocate/scale; reject with 402 when exceeded; clamp scale targets.
4. Default `VERBALAB_GPU_PROVISION_MODE=sandbox`; `disabled` blocks mutate paths.
5. Defer MIG/GPU sharing OS, multi-GPU device binding OS, distributed training fabric, and any real cloud provisioner.
6. Flip Inference Cloud catalog `gpu-platform` to partial; deferred flag → false.

## Consequences

- Developers can exercise scheduler/quota/autoscale safety without a cloud GPU bill.
- Cost Optimization (VL-211) remains the place for broader spend policy; GPU Platform already enforces local hard caps.
- Later rented-GPU work must keep ceilings and never enable open-ended autoscale by default.
