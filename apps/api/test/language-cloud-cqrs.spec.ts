import { describe, expect, it, vi } from 'vitest';
import { DetectDialectHandler } from '../src/language-cloud/application/handlers';
import { DetectDialectCommand } from '../src/language-cloud/application/messages';
import type { DialectPort } from '../src/language-cloud/application/ports';

describe('Language Cloud CQRS handlers', () => {
  it('DetectDialectHandler delegates to DialectPort', async () => {
    const port: DialectPort = {
      list: vi.fn(),
      detect: vi.fn(async () => ({
        language: 'sw',
        dialect: 'sw-ke',
        dialectName: 'Kenyan Swahili',
        confidence: 0.8,
        provider: 'cues',
        note: 'ok',
      })),
    };
    const handler = new DetectDialectHandler(port);
    const result = await handler.execute(
      new DetectDialectCommand('sasa poa', 'sw', {
        organizationId: 'org',
        workspaceId: 'ws',
      }),
    );
    expect(result.dialect).toBe('sw-ke');
    expect(port.detect).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'sasa poa', language: 'sw', organizationId: 'org' }),
    );
  });
});
