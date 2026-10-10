import { Injectable, NotFoundException } from '@nestjs/common';
import {
  findPlatformConnector,
  platformConnectorGuide,
  platformConnectorsEngine,
} from './platform-connectors.catalog';

@Injectable()
export class PlatformConnectorsService {
  engine() {
    return platformConnectorsEngine();
  }

  list(category?: string) {
    const engine = platformConnectorsEngine();
    const connectors = category
      ? engine.connectors.filter((c) => c.category === category)
      : engine.connectors;
    return {
      product: engine.product,
      note: engine.note,
      categories: engine.categories,
      apis: engine.apis,
      connectors,
      console: engine.console,
      docs: engine.docs,
      sdk: engine.sdk,
    };
  }

  get(id: string) {
    const entry = findPlatformConnector(id);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${id}`);
    }
    return platformConnectorGuide(entry);
  }

  demo(id: string, body?: { text?: string; source?: string; target?: string }) {
    const entry = findPlatformConnector(id);
    if (!entry) {
      throw new NotFoundException(`Unknown platform connector: ${id}`);
    }
    const text = (body?.text ?? 'Hello').slice(0, 500);
    const source = body?.source ?? 'en';
    const target = body?.target ?? 'ak';
    return {
      connectorId: entry.id,
      name: entry.name,
      ok: true,
      message: `${entry.name} demo hook accepted. Wire live credentials via Studio Connectors or env (${entry.envHint}).`,
      sample: {
        text,
        source,
        target,
        suggestedCalls: entry.lugemiApis.map((api) => api),
      },
      next: {
        translate: { method: 'POST', path: '/v1/translate', body: { text, source, target } },
        tts: {
          method: 'POST',
          path: '/v1/tts/synthesize',
          body: { text, voice: 'own:ak-gh-female' },
        },
        stt: { method: 'POST', path: '/v1/speech/recognize' },
        voiceClone: { method: 'GET', path: '/v1/voice-clones' },
        realtime: { method: 'POST', path: '/v1/speech/stream' },
        guide: { method: 'GET', path: `/v1/connectors/platform/${entry.id}` },
      },
      integrationGuide: entry.integrationGuide,
      console: `/connectors#${entry.id}`,
    };
  }
}
