import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/api-keys')
@UseGuards(ClerkAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get
  list(@CurrentSession session: SessionContext) {
    return this.apiKeys.list(session.organizationId);
  }

  @Post
  create(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Body body: { name?: string; environment?: string },
  ) {
    const name = body.name?.trim;
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    return this.apiKeys.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      name,
      environment: body.environment,
      ip: clientIp(req),
    });
  }

  @Delete(':id')
  revoke(
    @CurrentSession session: SessionContext,
    @Req req: Request,
    @Param('id') id: string,
  ) {
    return this.apiKeys.revoke(session.organizationId, id, {
      userId: session.userId,
      ip: clientIp(req),
    });
  }
}
