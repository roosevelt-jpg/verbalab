import { LanguageIntegrityService } from '../src/language-integrity/language-integrity.service';

describe('LanguageIntegrityService', () => {
  const clones = {
    get: jest.fn(),
  };
  const service = new LanguageIntegrityService(clones as never);

  it('returns attested when watermark + consent present', async () => {
    const result = await service.verify({
      watermarkHeader: 'required',
      consentAttested: true,
      attestationNotes: 'Speaker consent recorded for civic notice.',
    });
    expect(result.verdict).toBe('attested');
    expect(result.honesty.deepfakeDetectionClaimed).toBe(false);
  });

  it('rejects invalid watermark claims', async () => {
    const result = await service.verify({
      watermarkHeader: 'off',
      consentAttested: true,
      attestationNotes: 'Speaker consent recorded for civic notice.',
    });
    expect(result.verdict).toBe('rejected');
  });

  it('protocol includes government requirements', () => {
    const protocol = service.protocol();
    expect(protocol.requirements.length).toBeGreaterThanOrEqual(4);
    expect(protocol.endpoints.verify).toContain('/v1/language-integrity/verify');
  });
});
