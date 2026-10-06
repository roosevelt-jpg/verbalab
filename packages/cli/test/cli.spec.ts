import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('@lugemi/cli', () => {
  it('ships translate/languages/whoami and format commands', () => {
    const src = readFileSync(join(__dirname, '../src/cli.ts'), 'utf8');
    expect(src).toContain("command === 'translate'");
    expect(src).toContain("command === 'translate-format'");
    expect(src).toContain("command === 'translate-engine'");
    expect(src).toContain("command === 'languages'");
    expect(src).toContain("command === 'localize'");
    expect(src).toContain("command === 'localize-qa'");
    expect(src).toContain("command === 'locales'");
    expect(src).toContain("command === 'localization'");
    expect(src).toContain('@lugemi/sdk');
  });
});
