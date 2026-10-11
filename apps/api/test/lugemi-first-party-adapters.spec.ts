import { lugemiLocalTranslate } from '../src/gateway/lugemi-mt.engine';
import { lugemiLocalChat } from '../src/gateway/lugemi-chat.adapter';
import { createLugemiAsrAdapter } from '../src/gateway/lugemi-asr.adapter';
import { lugemiLocalEmbed } from '../src/gateway/lugemi-embed.adapter';

describe('Lugemi first-party local engines', () => {
  it('Baobab translates curated Africa-first phrases without vendor keys', () => {
    expect(lugemiLocalTranslate('hello', 'en', 'ak')).toMatch(/akye|Mema/i);
    expect(lugemiLocalTranslate('thank you', 'en', 'sw')).toMatch(/Asante/i);
    expect(lugemiLocalTranslate('I want to know how you are doing now.', 'en', 'ak')).toMatch(
      /wo ho te sɛn|mepɛ/i,
    );
    expect(lugemiLocalTranslate('how are you doing now', 'en', 'yo')).toMatch(/Báwo|báyìí/i);
    // Chat Studio starter: meta-prompt → spoken Twi greeting (not a hard fail).
    expect(
      lugemiLocalTranslate('Translate this greeting into Twi and play it back', 'en', 'ak'),
    ).toMatch(/Mema wo akye|Akwaaba/i);
    expect(lugemiLocalTranslate('Hello. Welcome to Lugemi.', 'en', 'ak')).toMatch(
      /Mema wo akye|Akwaaba/i,
    );
    // Unknown long form must not pretend English is a translation.
    expect(lugemiLocalTranslate('long form text for complex tasks', 'en', 'yo')).toMatch(
      /unavailable|no rendering/i,
    );
  });

  it('Atlas handles complex vertical prompts locally', () => {
    const law = lugemiLocalChat({
      messages: [{ role: 'user', content: 'Draft a legal bilingual notice for court filings' }],
    });
    expect(law.provider).toBe('lugemi_atlas');
    expect(law.message.content).toMatch(/Lex/i);

    const dialect = lugemiLocalChat({
      messages: [{ role: 'user', content: 'Help me with Twi dialect nuance' }],
    });
    expect(dialect.message.content).toMatch(/dialect|Baobab|Atlas/i);
  });

  it('Echo Listen transcribes without third-party keys', async () => {
    const asr = createLugemiAsrAdapter();
    const out = await asr.transcribe({
      buffer: Buffer.alloc(32000),
      filename: 'sample.wav',
      mimeType: 'audio/wav',
      language: 'sw',
    });
    expect(out.provider).toBe('lugemi_echo_listen');
    expect(out.text).toMatch(/Echo Listen/i);
  });

  it('Vector embeds locally without third-party keys', () => {
    const out = lugemiLocalEmbed(['Karibu Lugemi'], 'lugemi-vector-embed-v1');
    expect(out.provider).toBe('lugemi_vector');
    expect(out.data[0].embedding).toHaveLength(384);
  });
});
