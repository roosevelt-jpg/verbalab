# Global Deployment Controller (VL-318)

Library Phase 185 — part of Volume 17 Control Plane Cloud.

## Mission

VerbaLab Global Deployment Controller provides the Global Deployment Controller surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing VerbaLab systems — does not regenerate Volumes 1–16.
- `productionDeployRequiresAuthorization=true`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/global-deployment-controller`
- API: `/v1/global-deployment-controller/engine`
- ADR: [`docs/adr/0220-global-deployment-controller.md`](./adr/0220-global-deployment-controller.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
