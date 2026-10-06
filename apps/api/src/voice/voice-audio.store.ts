import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type AudioEntry = {
  buffer: Buffer;
  mimeType: string;
  expiresAt: number;
};

/** Short-lived public clips for Twilio <Play>. */
@Injectable()
export class VoiceAudioStore {
  private readonly clips = new Map<string, AudioEntry>();

  put(buffer: Buffer, mimeType: string, ttlMs = 10 * 60 * 1000): string {
    this.sweep();
    const id = randomUUID();
    this.clips.set(id, { buffer, mimeType, expiresAt: Date.now() + ttlMs });
    return id;
  }

  get(id: string): AudioEntry | null {
    const entry = this.clips.get(id);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.clips.delete(id);
      return null;
    }
    return entry;
  }

  private sweep() {
    const now = Date.now();
    for (const [id, entry] of this.clips) {
      if (entry.expiresAt < now) this.clips.delete(id);
    }
  }
}
