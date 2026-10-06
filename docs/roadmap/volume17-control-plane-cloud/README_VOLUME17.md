# VerbaLab — Volume 17: Control Plane Cloud (Phases 181–190)

Same workflow as Volumes 1–16. `.cursorrules` at the repo root still applies.

## Read this before you run any of it — this is the highest-privilege volume yet

Everything up to now built a product or a layer. This volume builds the thing
that controls *all of them at once* — org/tenant management, the global
policy engine, deployment controller, and secrets/certificate authority. If
Volume 11's marketplace was "handles money" and Volume 15's Trust Cloud was
"is supposed to enforce safety," this is "if this is compromised or
misconfigured, every other volume inherits the damage." Treat it with
correspondingly more care than any volume so far.

Specific things worth checking, not just reading:

- **Phase 06 (Secrets & Certificate Platform):** confirm secrets are actually
  encrypted at rest and never logged in plaintext anywhere (including
  Cursor's own generated logging/observability code). Check it's backed by a
  real secrets manager pattern (envelope encryption, access auditing) and
  not just an encrypted database column being called a "secrets manager."
- **Phase 04 (Global Deployment Controller):** this can push changes across
  every cloud you've built. Check it requires explicit authorization for
  production deploys and has a real rollback path — a bug here has the
  largest possible blast radius of anything in this entire 17-volume build.
- **Phase 01 (Organization Control)** and **Phase 03 (Global Policy Engine):**
  verify access here follows least-privilege — not every engineer on your
  team needs control-plane admin rights, and whoever/whatever has them can
  affect the whole platform at once.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 181 Control Plane Foundation | Base infra + architecture (see prepended context) |
| 01 | 182 Organization Control | Org/tenant/workspace management |
| 02 | 183 Global Configuration Platform | Platform-wide config store |
| 03 | 184 Global Policy Engine | Platform-wide policy enforcement |
| 04 | 185 Global Deployment Controller | Cross-cloud deployment orchestration |
| 05 | 186 Global Routing Controller | Cross-cloud request routing |
| 06 | 187 Secrets & Certificate Platform | Secrets manager + CA |
| 07 | 188 Global Scheduler | Platform-wide job/task scheduling |
| 08 | 189 Control Plane Analytics | Usage/health analytics |
| 09 | 190 Control Plane Production Audit | Hardening pass — review, don't add features |

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 190

Seventeen volumes, 190 phases. Ask for Volume 18 (Data Plane, Phases
191–200) when ready.
