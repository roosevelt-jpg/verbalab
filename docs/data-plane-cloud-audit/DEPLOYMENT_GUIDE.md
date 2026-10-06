# Data Plane Cloud — Deployment Guide

1. Deploy API with Volume 18 modules registered in `app.module.ts`.
2. Web consoles under `/data-plane-cloud`, `/translation-runtime`, `/data-plane-streaming`, `/gpu-runtime`, etc.
3. Do not enable Service Mesh / VAIOS from this volume.
4. GPU: keep sandbox / budget ceilings from `gpu-platform` before any real cloud GPU account.
5. Control Plane remains authoritative for orgs/policies/billing.
