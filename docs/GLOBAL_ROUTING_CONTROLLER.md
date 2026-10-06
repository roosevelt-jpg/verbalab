# Global Routing Controller (VL-319)

Library Phase 186 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Global Routing Controller provides the Global Routing Controller surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing VerbaLab systems — does not regenerate Volumes 1–16.
- `istioOs=false`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/global-routing-controller`
- API: `/v1/global-routing-controller/engine`
- ADR: [`docs/adr/0221-global-routing-controller.md`](./adr/0221-global-routing-controller.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
