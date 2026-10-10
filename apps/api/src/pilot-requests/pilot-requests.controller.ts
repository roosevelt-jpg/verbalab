import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { clientIp } from '../common/http/client-ip';
import { PilotRequestInput, PilotRequestsService } from './pilot-requests.service';

const WINDOW_MS = 60 * 60_000;
const MAX_PER_WINDOW = 5;

@Controller('v1/pilot-requests')
export class PilotRequestsController {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly pilots: PilotRequestsService) {}

  private allow(ip: string): boolean {
    const now = Date.now();
    if (this.hits.size > 10_000) {
      for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
    }
    const entry = this.hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    entry.count += 1;
    return entry.count <= MAX_PER_WINDOW;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() body: PilotRequestInput & { website?: unknown }) {
    // Hidden "website" field: humans never see it, form-filling bots do.
    if (typeof body.website === 'string' && body.website.trim()) return { ok: true };
    const ip = (req.headers['fly-client-ip'] as string | undefined) ?? clientIp(req) ?? null;
    if (!this.allow(ip ?? 'unknown')) {
      throw new ApiException('rate_limited', 'Too many requests — please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }
    return this.pilots.create(body, ip);
  }
}

@Controller('v1/admin/pilot-requests')
@UseGuards(PlatformAdminGuard)
export class PilotRequestsAdminController {
  constructor(private readonly pilots: PilotRequestsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.pilots.list(status?.trim() || undefined);
  }

  @Patch(':id')
  setStatus(@Param('id') id: string, @Body() body: { status?: unknown }) {
    return this.pilots.setStatus(id, body.status);
  }
}
