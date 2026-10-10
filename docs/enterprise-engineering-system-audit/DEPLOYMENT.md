# Enterprise Engineering System — Deployment Guide

1. Deploy API with Volume 20 modules registered in `app.module.ts`.
2. Web consoles under `/enterprise-engineering-system`, `/engineering-governance`, `/architecture-governance`, `/repository-standards`, `/engineering-quality-platform`, `/ai-engineering-standards`, `/api-engineering-standards`, `/database-engineering-standards`, `/infrastructure-engineering-standards`.
3. Do not enable Architecture Knowledge Base OS / mass ADR factory from this volume.
4. Fly remains the default deploy target; Kubernetes standards are catalog guidance (`kubernetesOs=false`).
5. Platform Engineering, DX, Trust AI Governance, and existing `docs/adr/` remain authoritative for their domains.
