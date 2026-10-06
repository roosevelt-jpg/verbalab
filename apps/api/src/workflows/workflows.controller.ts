import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiKeyGuard, ApiKeyContext } from '../common/guards/api-key.guard';
import { CurrentApiKey, CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { JobsService } from '../jobs/jobs.service';

@Controller('v1/workflows')
export class WorkflowsController {
  constructor(
    private readonly workflows: WorkflowsService,
    @Inject(forwardRef( => JobsService))
    private readonly jobs: JobsService,
  ) {}

  @Get
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession session: SessionContext) {
    return this.workflows.list(session.organizationId, session.workspaceId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  get(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.workflows.get(session.organizationId, id);
  }

  @Post
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession session: SessionContext,
    @Body body: { name?: string; steps?: unknown },
  ) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can create workflows',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.workflows.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      name: body.name ?? '',
      steps: body.steps,
      userId: session.userId,
    });
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  remove(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.workflows.remove({
      organizationId: session.organizationId,
      workflowId: id,
      userId: session.userId,
      role: session.role,
    });
  }

  /** Run a saved definition (inline steps also via POST /v1/jobs type=workflow). */
  @Post(':id/run')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  async run(
    @CurrentApiKey auth: ApiKeyContext,
    @Param('id') id: string,
    @Body body: { webhookUrl?: string },
  ) {
    const def = await this.workflows.get(auth.organizationId, id);
    return this.jobs.create({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      type: 'workflow',
      payload: {
        workflowId: def.id,
        name: def.name,
        steps: def.steps,
      },
      webhookUrl: body?.webhookUrl,
      route: 'POST /v1/workflows/:id/run',
    });
  }
}
