# VAIOS — Deployment Guide

1. Deploy API with Volume 19 modules registered in `app.module.ts`.
2. Web consoles under `/vaios`, `/ai-scheduler`, `/runtime-manager`, `/resource-manager`, `/workflow-operating-system`, `/agent-operating-system`, `/ai-memory-operating-system`, `/knowledge-operating-system`, `/plugin-operating-system`.
3. Do not enable Enterprise Engineering System / Service Mesh OS from this volume.
4. GPU: keep sandbox / budget ceilings from `gpu-platform` / `gpu-runtime`.
5. Kernel and Fabric remain authoritative for agent/workflow/memory/plugin execution.
