# @lugemi/cli

Thin command-line client for the Lugemi API (`@lugemi/sdk`).

```bash
pnpm --filter @lugemi/cli build
export LUGEMI_API_KEY=lg_live_...
# or soft sandbox:
export LUGEMI_API_KEY=lg_test_...

lugemi languages
lugemi whoami
lugemi translate --text "Hello" --target sw --source en
```

Not a full developer platform CLI. See `docs/DEVELOPER_CLOUD.md`.
