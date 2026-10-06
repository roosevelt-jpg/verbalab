# Global Policy Engine (VL-317)

Library Phase 184 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Global Policy Engine provides the Global Policy Engine surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing VerbaLab systems — does not regenerate Volumes 1–16.
- `policyRuntimeIntegrated=true`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/global-policy-engine`
- API: `/v1/global-policy-engine/engine`
- ADR: [`docs/adr/0219-global-policy-engine.md`](./adr/0219-global-policy-engine.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
