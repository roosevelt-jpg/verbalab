import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalStorageService {
  rootDir(): string {
    return process.env.DOCUMENT_STORAGE_DIR ?? join(process.cwd(), 'storage');
  }

  absolutePath(storageKey: string): string {
    return join(this.rootDir(), storageKey);
  }

  async writeBuffer(storageKey: string, data: Buffer): Promise<void> {
    const path = this.absolutePath(storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async readBuffer(storageKey: string): Promise<Buffer> {
    return readFile(this.absolutePath(storageKey));
  }

  async tryUnlink(storageKey: string): Promise<void> {
    try {
      await unlink(this.absolutePath(storageKey));
    } catch {
      // best-effort cleanup
    }
  }
}
