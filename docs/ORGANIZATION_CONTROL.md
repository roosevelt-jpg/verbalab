# Organization Control (VL-315)

Library Phase 182 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Organization Control provides the Organization Control surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing VerbaLab systems — does not regenerate Volumes 1–16.
- `leastPrivilegeRequired=true`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/organization-control`
- API: `/v1/organization-control/engine`
- ADR: [`docs/adr/0217-organization-control.md`](./adr/0217-organization-control.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
