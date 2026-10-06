# African Intelligence Cloud — Deployment Guide (VL-270)

## Deploy with the shared platform

1. Use existing Fly / Docker / Actions paths (`infra/DEPLOY.md`).
2. Optional EKS: `infra/AWS_EKS.md`, primary region `af-south-1`.
3. No new graph database, scrape cluster, or digital-twin runtime required for Volume 12.
4. Clerk required for `/v1/african-intelligence-cloud/overview` and console overview page.
5. Domain engine GETs are public catalog reads — protect any future write paths with auth + Policy Fabric.

## Post-deploy smoke

```bash
curl -s "$API/v1/african-intelligence-cloud/products" | jq '.honesty'
curl -s "$API/v1/healthcare-intelligence/engine" | jq '.honesty.notMedicalAdvice'
curl -s "$API/v1/cultural-intelligence/engine" | jq '.honesty.traditionalKnowledgeConsentRequired'
curl -s "$API/v1/african-knowledge-graph/nodes" | jq '.neo4jOs'
```
