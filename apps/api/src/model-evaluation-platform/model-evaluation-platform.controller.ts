import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ModelEvaluationPlatformService } from './model-evaluation-platform.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/model-evaluation-platform')
export class ModelEvaluationPlatformController {
  constructor(private readonly platform: ModelEvaluationPlatformService) {}

  @Get('engine')
  engine() {
    return this.platform.engine();
  }

  @Get('suites')
  suites() {
    return this.platform.suites();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.platform.overview(session);
  }

  @Get('runs')
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession() session: SessionContext) {
    return this.platform.listRuns(session);
  }

  @Get('runs/:id')
  @UseGuards(ClerkAuthGuard)
  get(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.platform.getRun(session, id);
  }

  @Post('runs')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      suite?: string;
      label?: string;
      execute?: boolean;
      targetLatencyMs?: number;
    },
  ) {
    return this.platform.createRun(session, body);
  }

  @Post('runs/:id/execute')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  execute(
    @CurrentSession() session: SessionContext,
    @Param('id') id: string,
    @Body() body: { targetLatencyMs?: number },
  ) {
    return this.platform.executeRun(session, id, body);
  }

  @Post('runs/:id/cancel')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.platform.cancelRun(session, id);
  }

  @Get('leaderboard')
  @UseGuards(ClerkAuthGuard)
  leaderboard(@CurrentSession() session: SessionContext) {
    return this.platform.leaderboard(session);
  }

  @Get('reports')
  @UseGuards(ClerkAuthGuard)
  reports(@CurrentSession() session: SessionContext) {
    return this.platform.reports(session);
  }

  @Get('monitoring')
  @UseGuards(ClerkAuthGuard)
  monitoring(@CurrentSession() session: SessionContext) {
    return this.platform.monitoring(session);
  }
}
