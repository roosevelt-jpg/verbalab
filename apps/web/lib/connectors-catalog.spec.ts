import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_CATEGORIES,
  PLATFORM_CONNECTORS,
  countConnected,
  connectedFlags,
  type ConnectorInstall,
} from './connectors-catalog';

describe('connectors-catalog', () => {
  it('includes legacy and new high-value platform install targets', () => {
    const ids = PLATFORM_CONNECTORS.map((c) => c.id);
    expect(ids).toContain('twilio');
    expect(ids).toContain('livekit');
    expect(ids).toContain('retell');
    expect(ids).toContain('africas-talking');
    expect(ids).toContain('whatsapp-cloud');
    expect(ids).toContain('amazon-connect');
    expect(ids).toContain('salesforce');
    expect(ids).toContain('moodle');
    expect(ids).toContain('dhis2');
    expect(ids).toContain('unity');
    expect(ids).toContain('captionhub');
    expect(ids).toContain('flutterwave');
    expect(CONNECTOR_CATEGORIES.some((c) => c.id === 'messaging')).toBe(true);
    expect(CONNECTOR_CATEGORIES.some((c) => c.id === 'fintech')).toBe(true);
  });

  it('counts connected installs and mirrors chat flags', () => {
    const map: Record<string, ConnectorInstall> = {
      twilio: { connected: true, connectedAt: 1 },
      vapi: { connected: false },
      higgsfield: { connected: true },
    };
    expect(countConnected(map)).toBe(2);
    expect(connectedFlags(map)).toEqual({
      twilio: true,
      vapi: false,
      higgsfield: true,
    });
  });

  it('gives every connector a demo path, docs blurb, and integration guide', () => {
    for (const c of PLATFORM_CONNECTORS) {
      expect(c.docs.length).toBeGreaterThan(20);
      expect(c.integrationGuide.length).toBeGreaterThan(20);
      expect(c.demoHref.startsWith('/')).toBe(true);
      expect(c.envHint.length).toBeGreaterThan(5);
      expect(c.integrationGuide).not.toMatch(/ADR-\d+/i);
      expect(c.docs).not.toMatch(/\b(shipped|partial)\b/i);
    }
  });
});
