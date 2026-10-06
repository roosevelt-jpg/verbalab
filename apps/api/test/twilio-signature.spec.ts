import { signTwilioRequest, verifyTwilioSignature, parseFormBody } from '../src/voice/twilio-signature';

describe('Twilio signature (VL-084)', () => {
  const token = 'test_auth_token';
  const url = 'https://api.example.com/v1/voice/twilio/inbound';

  it('signs and verifies form params', () => {
    const params = { CallSid: 'CA123', From: '+15551234567', To: '+15557654321' };
    const signature = signTwilioRequest(token, url, params);
    expect(
      verifyTwilioSignature({
        authToken: token,
        signature,
        url,
        params,
      }),
    ).toBe(true);
    expect(
      verifyTwilioSignature({
        authToken: token,
        signature: 'bad',
        url,
        params,
      }),
    ).toBe(false);
  });

  it('parses form bodies', () => {
    expect(parseFormBody('CallSid=CA1&From=%2B1555')).toEqual({
      CallSid: 'CA1',
      From: '+1555',
    });
  });
});
