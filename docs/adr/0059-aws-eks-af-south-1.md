# ADR-0059: AWS EKS + Terraform (af-south-1)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-138 (Language Cloud queue #8 — infra)

## Context

Language Cloud deferred Terraform/Kubernetes until a cloud provider was chosen. Operator selected **AWS** and region **`af-south-1`** (Cape Town). Fly.io (VL-074) remains the default PaaS path; this adds an optional EKS path without regenerating Docker images or Fly configs.

## Decision

1. **Provider/region:** AWS `af-south-1`.
2. **Terraform** under `infra/terraform/aws-eks/` — VPC (2 AZs), EKS control plane, managed node group.
3. **Kubernetes** manifests under `infra/k8s/` — `verbalab` namespace, api/web Deployments + Services, Ingress, ConfigMap, example Secret.
4. **Images:** reuse existing `apps/api/Dockerfile` and `apps/web/Dockerfile` (push to ECR or any registry; tfvars for image URIs).
5. **Data plane:** Postgres/Redis stay **managed buy** (`DATABASE_URL` / `REDIS_URL` secrets) — not self-hosted on the cluster in this phase.
6. **Fly remains supported** — EKS is additive; see `infra/AWS_EKS.md`.

## Consequences

- Architecture notes: `terraform: true`, `kubernetes: true`.
- Language Cloud deferred infra queue complete.
- Applying Terraform incurs AWS cost; apply is operator-owned (not CI-required).
