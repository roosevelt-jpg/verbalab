import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../../..');

describe('Production deploy config', () => {
  it('ships API and web Dockerfiles', () => {
    expect(existsSync(join(root, 'apps/api/Dockerfile'))).toBe(true);
    expect(existsSync(join(root, 'apps/web/Dockerfile'))).toBe(true);
    expect(existsSync(join(root, '.dockerignore'))).toBe(true);
  });

  it('configures Fly API release migrate and health check', () => {
    const toml = readFileSync(join(root, 'infra/fly/api.toml'), 'utf8');
    expect(toml).toContain("app = 'lugemi-api'");
    expect(toml).toContain('fly-migrate.sh');
    expect(toml).toContain("path = '/health'");
    expect(toml).toContain("PORT = '3001'");
    expect(toml).toContain('internal_port = 3001');
  });


  it('requires FLY_API_TOKEN on the canonical repo and deploys both apps', () => {
    const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(yml).toContain('FLY_API_TOKEN');
    expect(yml).toContain('roosevelt-jpg/verbalab');
    expect(yml).toContain('Verify token can manage API + web apps');
    expect(yml).toContain('Smoke production health + /coverage');
    expect(yml).toContain('infra/fly/api.jnb.toml');
    expect(yml).toContain('infra/fly/web.jnb.toml');
    expect(yml).toContain('superfly/flyctl-actions/setup-flyctl@1.5');
    // Soft-skip is only for forks — canonical repo must fail without a token.
    expect(yml).toContain('exit 1');
    expect(yml).toContain('Preflight — marketing /coverage must ship in Docker context');
  });

  it('does not dockerignore the marketing /coverage route', () => {
    const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');
    expect(dockerignore).not.toMatch(/^\*\*\/coverage$/m);
    expect(dockerignore).not.toMatch(/^\*\*\/coverage\//m);
    expect(existsSync(join(root, 'apps/web/app/coverage/page.tsx'))).toBe(true);
  });

  it('ships EU residency island configs', () => {
    const eu = readFileSync(join(root, 'infra/fly/api.eu.toml'), 'utf8');
    expect(eu).toContain("app = 'lugemi-api-eu'");
    expect(eu).toContain("primary_region = 'ams'");
    expect(eu).toContain("LUGEMI_REGION = 'eu'");
    expect(existsSync(join(root, 'infra/fly/web.eu.toml'))).toBe(true);
    const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(yml).toContain('FLY_DEPLOY_EU');
    expect(yml).toContain('infra/fly/api.eu.toml');
  });

  it('configures web Fly health checks and smoke script', () => {
    const web = readFileSync(join(root, 'infra/fly/web.toml'), 'utf8');
    expect(web).toContain("path = '/health'");
    expect(web).toContain("app = 'lugemi-web-us'");
    expect(web).toContain("HOSTNAME = '0.0.0.0'");
    expect(web).toContain("grace_period = '60s'");
    const webJnb = readFileSync(join(root, 'infra/fly/web.jnb.toml'), 'utf8');
    expect(webJnb).toContain("app = 'lugemi-web'");
    expect(webJnb).toContain("primary_region = 'jnb'");
    expect(webJnb).toContain("HOSTNAME = '0.0.0.0'");
    expect(webJnb).toContain("grace_period = '60s'");
    expect(webJnb).toContain("PORT = '3000'");
    expect(webJnb).toContain('internal_port = 3000');
    const webEu = readFileSync(join(root, 'infra/fly/web.eu.toml'), 'utf8');
    expect(webEu).toContain("path = '/health'");
    expect(webEu).toContain("app = 'lugemi-web-eu'");
    expect(webEu).toContain("HOSTNAME = '0.0.0.0'");
    expect(existsSync(join(root, 'scripts/smoke-deploy.mjs'))).toBe(true);
    expect(existsSync(join(root, 'scripts/fly-prune-lugemi-web-non-jnb.sh'))).toBe(
      true,
    );
    const apiDocker = readFileSync(join(root, 'apps/api/Dockerfile'), 'utf8');
    expect(apiDocker).toContain('HEALTHCHECK');
    const webDocker = readFileSync(join(root, 'apps/web/Dockerfile'), 'utf8');
    expect(webDocker).toContain('HEALTHCHECK');
    expect(webDocker).toContain('/health');
    expect(webDocker).toContain('HOSTNAME=0.0.0.0');
    const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(yml).toContain('fly-prune-lugemi-web-non-jnb.sh');
    expect(yml).not.toContain('--region jnb');
    const mw = readFileSync(join(root, 'apps/web/middleware.ts'), 'utf8');
    expect(mw).toContain('health(?:/.*)?$');
  });
});
