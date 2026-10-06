# @verbalab/cli

Thin command-line wrapper over `@verbalab/sdk`.

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
