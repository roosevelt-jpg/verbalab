# @verbalab/cli

Thin command-line client for the Lugemi API (`@verbalab/sdk`). Historical package name; public product is Lugemi.

```bash
pnpm --filter @verbalab/cli build
export VERBALAB_API_KEY=vl_live_...
# or soft sandbox:
export VERBALAB_API_KEY=vl_test_...

verbalab languages
verbalab whoami
verbalab translate --text "Hello" --target sw --source en
```

Not a full developer platform CLI. See `docs/DEVELOPER_CLOUD.md`.
