/** Public SDK/CLI catalog for docs and developer hub (hand-maintained with package versions). */
export function sdkCatalog() {
  return {
    typescript: {
      name: '@lugemi/sdk',
      version: '0.1.0',
      install: 'pnpm add @lugemi/sdk',
      private: true,
      note: 'Workspace package in this monorepo; not a multi-language SDK factory.',
    },
    cli: {
      name: '@lugemi/cli',
      version: '0.1.0',
      bin: 'lugemi',
      install: 'pnpm add -g @lugemi/cli',
      commands: ['translate', 'languages', 'whoami'],
      note: 'Thin wrapper over @lugemi/sdk.',
    },
    auth: {
      livePrefix: 'lg_live_',
      testPrefix: 'lg_test_',
    },
  };
}
