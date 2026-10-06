# AWS EKS deploy (VL-138 / ADR-0059)

**Region:** `af-south-1` (Cape Town)  
**Path:** Additive to Fly.io (VL-074). Do not delete `infra/fly/*`.

## Prerequisites

- AWS account + IAM permissions for VPC/EKS/IAM
- Terraform `>= 1.5`
- `aws` CLI + `kubectl`
- Container images built from `apps/api/Dockerfile` and `apps/web/Dockerfile`

## 1. Terraform (cluster)

```bash
cd infra/terraform/aws-eks
cp terraform.tfvars.example terraform.tfvars
# edit if needed — default region is af-south-1

terraform init
terraform plan
terraform apply
```

Configure kubectl (printed as output `configure_kubectl`):

```bash
aws eks update-kubeconfig --region af-south-1 --name lugemi
```

## 2. Images

Build and push to ECR (or any registry), then replace `REPLACE_ECR_OR_REGISTRY` in `infra/k8s/*-deployment.yaml`.

## 3. Secrets + migrate + apps

```bash
# Create real secret (do not commit)
kubectl apply -f infra/k8s/namespace.yaml
kubectl create secret generic lugemi-secrets -n lugemi \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=CLERK_SECRET_KEY='...' \
  --from-literal=OPENAI_API_KEY='...'

kubectl apply -k infra/k8s
kubectl apply -f infra/k8s/api-deployment.yaml   # includes migrate Job
```

Postgres and Redis remain **managed** (`DATABASE_URL` / `REDIS_URL`). Prefer providers available near `af-south-1` or accept cross-region latency until a Cape Town DB exists.

## 4. Ingress

Install [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/), then update hosts in `infra/k8s/ingress.yaml`.

## Cost note

EKS control plane + NAT Gateway + nodes incur ongoing AWS charges. Destroy when unused:

```bash
cd infra/terraform/aws-eks && terraform destroy
```

## Fly vs EKS

| | Fly (default) | EKS (this path) |
| --- | --- | --- |
| Docs | `infra/DEPLOY.md` | `infra/AWS_EKS.md` |
| When | Day-to-day PaaS | Customer/ops requires AWS/K8s |
