# Secrets & Certificate Platform (VL-320)

Library Phase 187 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Secrets & Certificate Platform provides the Secrets & Certificate Platform surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing VerbaLab systems — does not regenerate Volumes 1–16.
- `encryptedAtRest=true`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/secrets-certificate-platform`
- API: `/v1/secrets-certificate-platform/engine`
- ADR: [`docs/adr/0222-secrets-certificate-platform.md`](./adr/0222-secrets-certificate-platform.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
