import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../..');

describe('AWS EKS infra (VL-138)', () => {
  it('ships Terraform for af-south-1 and K8s manifests', () => {
    const tfMain = join(root, 'infra/terraform/aws-eks/main.tf');
    const tfVars = join(root, 'infra/terraform/aws-eks/terraform.tfvars.example');
    const kustomize = join(root, 'infra/k8s/kustomization.yaml');
    const runbook = join(root, 'infra/AWS_EKS.md');
    const adr = join(root, 'docs/adr/0059-aws-eks-af-south-1.md');

    expect(existsSync(tfMain)).toBe(true);
    expect(existsSync(tfVars)).toBe(true);
    expect(existsSync(kustomize)).toBe(true);
    expect(existsSync(runbook)).toBe(true);
    expect(existsSync(adr)).toBe(true);

    const tf = readFileSync(tfVars, 'utf8');
    expect(tf).toContain('af-south-1');
    expect(readFileSync(runbook, 'utf8')).toContain('af-south-1');
    expect(readFileSync(adr, 'utf8')).toContain('af-south-1');
  });
});
