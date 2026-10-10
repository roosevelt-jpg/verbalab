# Control Plane Cloud Deployment Guide (VL-323)

1. Deploy API with existing Nest `AppModule` (Control Plane modules registered).
2. Web consoles under `/control-plane-cloud`, `/organization-control`, `/secrets-certificate-platform`, etc.
3. Production promote requires `authorized=true` or `authorizationToken` on `POST /v1/global-deployment-controller/promote`.
4. Secrets: wire platform KMS/envelope encryption in ops; APIs stay metadata-only (`hashicorpVaultOs=false`).
5. Data Plane deferred to Volume 18+ — do not invent here.
