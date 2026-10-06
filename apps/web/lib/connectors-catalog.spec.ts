import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_CATEGORIES,
  PLATFORM_CONNECTORS,
  countConnected,
  connectedFlags,
  type ConnectorInstall,
} from './connectors-catalog';

describe('connectors-catalog', () => {
  it('includes voice and video platform install targets', () => {
    const ids = PLATFORM_CONNECTORS.map((c) => c.id);
    expect(ids).toContain('twilio');
    expect(ids).toContain('vapi');
    expect(ids).toContain('google-voice');
    expect(ids).toContain('higgsfield');
    expect(ids).toContain('google-video');
    expect(CONNECTOR_CATEGORIES.some((c) => c.id === 'voice')).toBe(true);
    expect(CONNECTOR_CATEGORIES.some((c) => c.id === 'video')).toBe(true);
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

  it('gives every connector a demo path and docs blurb', () => {
    for (const c of PLATFORM_CONNECTORS) {
      expect(c.docs.length).toBeGreaterThan(20);
      expect(c.demoHref.startsWith('/')).toBe(true);
      expect(c.envHint.length).toBeGreaterThan(5);
    }
  });
});
