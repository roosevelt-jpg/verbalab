import { Injectable } from '@nestjs/common';
import { benchmarkPlatformEngineCatalog } from './benchmark-platform.catalog';

@Injectable()
export class BenchmarkPlatformService {
  engine() {
    return benchmarkPlatformEngineCatalog();
  }

  leaderboard(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const leaderboard = catalog.leaderboard.filter((r) => {
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.suiteId.toLowerCase().includes(q) ||
        r.modelLabel.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    });
    return {
      leaderboard,
      count: leaderboard.length,
      suites: catalog.suites,
      honesty: catalog.honesty,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.leaderboard(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'benchmark',
      suiteCount: catalog.suites.length,
      leaderboardCount: catalog.leaderboard.length,
      honesty: catalog.honesty,
      note: 'Benchmark Platform monitoring snapshot.',
    };
  }
}
