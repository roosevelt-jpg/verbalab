# ADR-0026: Slack connector (one tool)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-082

## Context

Distribution needs one connector into an existing chat tool. We will not build a connector platform or Zapier competitor. Google Drive would force OAuth + file pipelines; Slack fits inbound signed webhooks + `TranslateService`.

## Decision

1. **Pick Slack** (not Drive). Slash command `POST /v1/connectors/slack/commands` verifies `X-Slack-Signature`, maps `team_id` → `SlackInstallation`, calls `TranslateService` (`source=auto`), returns an in-channel reply.
2. **Events** endpoint handles `url_verification` only in this slice (optional `chat.postMessage` when `SLACK_BOT_TOKEN` is set).
3. **Console** `/connectors` links Team ID + default target; no OAuth install UI.
4. **CI:** fixture MT + signed payloads; no live Slack. `SLACK_CONNECTOR_DISABLED=1` kills the connector.

## Consequences

- Workspaces must be linked before slash commands work.
- File-in-Slack / Drive deferred.
