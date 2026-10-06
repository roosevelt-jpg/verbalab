/** Public SDK/CLI catalog for docs and developer hub (hand-maintained with package versions). */
export function sdkCatalog() {
  return {
    typescript: {
      name: '@verbalab/sdk',
      version: '0.1.0',
      install: 'pnpm add @verbalab/sdk',
      private: true,
      note: 'Workspace package in this monorepo; not a multi-language SDK factory.',
    },
    cli: {
      name: '@verbalab/cli',
      version: '0.1.0',
      bin: 'verbalab',
      install: 'pnpm add -g @verbalab/cli',
      commands: ['translate', 'languages', 'whoami'],
      note: 'Thin wrapper over @verbalab/sdk.',
    },
    auth: {
      livePrefix: 'vl_live_',
      testPrefix: 'vl_test_',
    },
  };
}
