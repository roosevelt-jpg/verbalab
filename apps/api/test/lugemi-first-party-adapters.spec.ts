import { lugemiLocalTranslate } from '../src/gateway/lugemi-mt.engine';
import { lugemiLocalChat } from '../src/gateway/lugemi-chat.adapter';
import { createLugemiAsrAdapter } from '../src/gateway/lugemi-asr.adapter';
import { lugemiLocalEmbed } from '../src/gateway/lugemi-embed.adapter';

describe('Lugemi first-party local engines', () => {
  it('Baobab translates curated Africa-first phrases without vendor keys', () => {
    expect(lugemiLocalTranslate('hello', 'en', 'ak')).toMatch(/akye|Mema/i);
    expect(lugemiLocalTranslate('thank you', 'en', 'sw')).toMatch(/Asante/i);
    expect(lugemiLocalTranslate('long form text for complex tasks', 'en', 'yo')).toContain('Baobab');
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
