import { describe, expect, it } from 'vitest';
import { signSlackRequest, verifySlackSignature } from '../src/connectors/slack-signature';

describe('Slack signature', () => {
  it('accepts a valid signature within the time window', () => {
    const secret = 'test_signing_secret';
    const timestamp = '1710000000';
    const body = 'token=x&team_id=T1&text=sw+Hello';
    const signature = signSlackRequest(secret, timestamp, body);
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp,
        signature,
        rawBody: body,
        nowSec: 1710000010,
      }),
    ).toBe(true);
  });

  it('rejects stale or wrong signatures', () => {
    const secret = 'test_signing_secret';
    const timestamp = '1710000000';
    const body = 'text=hi';
    const signature = signSlackRequest(secret, timestamp, body);
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp,
        signature,
        rawBody: body,
        nowSec: 1710000000 + 60 * 10,
      }),
    ).toBe(false);
    expect(
      verifySlackSignature({
        signingSecret: secret,
        timestamp,
        signature: 'v0=deadbeef',
        rawBody: body,
        nowSec: 1710000000,
      }),
    ).toBe(false);
  });
});
