import { Test } from '@nestjs/testing';
import { CreativeMediaService } from '../src/creative-media/creative-media.service';

describe('CreativeMediaService', () => {
  let service: CreativeMediaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CreativeMediaService],
    }).compile();
    service = moduleRef.get(CreativeMediaService);
  });

  it('lists shipped creative media capabilities', () => {
    const engine = service.engine();
    expect(engine.capabilities.every((c) => c.status === 'shipped')).toBe(true);
    expect(engine.capabilities.map((c) => c.id).sort()).toEqual(
      ['image', 'music', 'sfx', 'video_plan'].sort(),
    );
  });

  it('generates a PNG still for a prompt', () => {
    const image = service.generateImage({ prompt: 'Product launch in Accra', style: 'product' });
    expect(image.mimeType).toBe('image/png');
    expect(image.imageBase64.length).toBeGreaterThan(200);
    const buf = Buffer.from(image.imageBase64, 'base64');
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('builds a video plan with scene stills', () => {
    const plan = service.generateVideoPlan({
      title: 'Film trailer',
      script: 'Tonight, a story unfolds. Trust the voice that sounds like home.',
    });
    expect(plan.scenes.length).toBeGreaterThanOrEqual(2);
    expect(plan.scenes[0]!.imageBase64.length).toBeGreaterThan(100);
  });

  it('synthesizes SFX and music WAV payloads', () => {
    const sfx = service.generateSfx({ prompt: 'Rain on window', durationSec: 1 });
    const music = service.generateMusic({ prompt: 'Quiet documentary underscore', durationSec: 4 });
    expect(sfx.mimeType).toBe('audio/wav');
    expect(music.mimeType).toBe('audio/wav');
    expect(Buffer.from(sfx.audioBase64, 'base64').subarray(0, 4).toString()).toBe('RIFF');
    expect(Buffer.from(music.audioBase64, 'base64').subarray(0, 4).toString()).toBe('RIFF');
  });
});
