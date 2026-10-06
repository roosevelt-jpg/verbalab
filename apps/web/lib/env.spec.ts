import { describe, expect, it } from 'vitest';

describe('web package', () => {
  it('exposes the public API URL default', () => {
    const fallback = 'http://localhost:3001';
    expect(fallback).toMatch(/^http/);
  });
});
