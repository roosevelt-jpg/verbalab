# Lugemi — Volume 8: AI Kernel (Phases 81–90)

Same workflow as Volumes 1–7. `.cursorrules` at the repo root still applies.
This volume is the runtime core that Agent/Workflow/Plugin behavior across
the whole platform will route through. Remind Cursor in your first message
that Volumes 1–7 already exist.

## Run phases in order

| # | Phase | What it builds |
|---|---|---|
| 00 | 81 AI Kernel Foundation | Base runtime infra |
| 01 | 82 Memory Runtime | Low-level memory primitives for the kernel |
| 02 | 83 Prompt Runtime | Prompt execution primitives |
| 03 | 84 Context Runtime | Context assembly at the kernel level |
| 04 | 85 Reasoning Runtime | Reasoning execution primitives |
| 05 | 86 Agent Runtime | Runs autonomous agents |
| 06 | 87 Workflow Runtime | Runs multi-step workflows |
| 07 | 88 Plugin Runtime | Runs third-party/extension plugins |
| 08 | 89 Policy Runtime | Enforces guardrails/policy on everything above |
| 09 | 90 Kernel Production Audit | Hardening pass — review, don't add features |

## Two things worth actually checking on this volume

**Phases 05–07 (Agent, Workflow, Plugin Runtime)** are where code starts
*taking actions* on behalf of users rather than just answering questions —
calling APIs, running plugins, executing multi-step tasks autonomously. Check
each one has real scoped permissions (what an agent/plugin is actually
allowed to touch) and some form of sandboxing, not just "it calls the
function and hopes." An agent runtime with no action boundaries is the kind
of thing that's fine in a demo and genuinely dangerous once connected to real
accounts/data.

**Phase 08 (Policy Runtime)** is explicitly meant to be the enforcement layer
for everything above it. Don't just check that it exists — verify it's
actually wired into Agent/Workflow/Plugin Runtime as a hard gate (requests
get blocked), not merely logging/flagging after the fact. A policy engine
nobody's code actually calls is decoration, not a guardrail.

## Same process as before

1. New Cursor Agent conversation per phase.
2. Paste the file content below the `<!-- PASTE... -->` line.
3. Review the diff, actually run it, confirm it works.
4. Commit.
5. Next file.

## After Phase 90

Eight volumes, 90 phases. You're at the point where the platform can
plausibly run autonomous agents against real infrastructure — which makes
this the single most important pause-and-verify point so far, more than any
prior volume. Actually exercise Agent Runtime with a harmless test task
end-to-end and confirm Policy Runtime blocks something it should block,
before trusting it further. Volume 9 (Foundation Model Cloud, Phases 91–105)
starts covering model training — ask when you're ready.
