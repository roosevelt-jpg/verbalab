# Control Plane Cloud Architecture Report (VL-323)

Control Plane Cloud is the management layer over Policy Runtime, Policy Fabric, Trust Cloud,
Identity, Platform Engineering, Release Engineering, and AI Fabric routing.

Hubs: control-plane-cloud, organization-control, global-configuration-platform,
global-policy-engine, global-deployment-controller, global-routing-controller,
secrets-certificate-platform, global-scheduler, control-plane-analytics.

Does **not** invent Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, a second
policy OS/IdP, or Data Plane OS. Never executes inference.
