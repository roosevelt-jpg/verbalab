# Control Plane Cloud (VL-314)

Library Phase 181 — part of Volume 17 Control Plane Cloud.

## Mission

Lugemi Control Plane Cloud is the highest-privilege management layer that manages,
configures, secures, governs, deploys, and operates every Lugemi cloud service.
It never executes AI inference.

## Honesty

- `executesInference=false`.
- `dataPlaneOs=false` (deferred to Volume 18+).
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or a second policy OS/IdP.
- Wires over Policy Runtime / Policy Fabric / Trust Cloud / Identity / Platform Engineering.
- Secrets: envelope encryption + access audit; metadata-only APIs (`hashicorpVaultOs=false`).
- Production deploys require authorization; rollback path required.
- Least privilege: Control Plane Admin is not the default engineer role.

## Surfaces

- Console: `/control-plane-cloud`
- API: `/v1/control-plane-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0216-control-plane-cloud.md`](./adr/0216-control-plane-cloud.md)

---

## Volume status

**Volume 17 closed** (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/). Data Plane deferred to Volume 18+.
