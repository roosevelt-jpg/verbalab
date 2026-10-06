import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiKeyGuard, ApiKeyContext } from '../common/guards/api-key.guard';
import { CurrentApiKey, CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { JobType } from './job.types';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { WebhookService } from './webhook.service';

@Controller()
export class JobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly webhooks: WebhookService,
  ) {}

  @Post('v1/jobs')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  create(
    @CurrentApiKey() auth: ApiKeyContext,
    @Body()
    body: {
      type?: string;
      input?: unknown;
      webhookUrl?: string;
    },
  ) {
    if (body.type !== 'batch_translate' && body.type !== 'document_translate' && body.type !== 'workflow') {
      throw new ApiException(
        'validation_error',
        'type must be batch_translate, document_translate, or workflow',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.jobs.create({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      type: body.type as JobType,
      payload: body.input,
      webhookUrl: body.webhookUrl,
    });
  }

  @Get('v1/jobs')
  @UseGuards(ApiKeyGuard)
  list(@CurrentApiKey() auth: ApiKeyContext, @Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number(limitRaw) : 50;
    return this.jobs.list(auth.organizationId, Number.isFinite(limit) ? limit : 50);
  }

  @Get('v1/jobs/:id')
  @UseGuards(ApiKeyGuard)
  get(@CurrentApiKey() auth: ApiKeyContext, @Param('id') id: string) {
    return this.jobs.get(auth.organizationId, id);
  }

  /** Reveal/create the org webhook signing secret (console session). */
  @Post('v1/webhooks/signing-secret')
  @UseGuards(ClerkAuthGuard)
  async webhookSecret(@CurrentSession() session: SessionContext) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can manage webhooks',
        HttpStatus.FORBIDDEN,
      );
    }
    const secret = await this.webhooks.ensureSigningSecret(session.organizationId);
    return { signingSecret: secret };
  }
}
