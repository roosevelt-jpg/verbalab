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
import { ModelTrainingPlatformService } from './model-training-platform.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/model-training-platform')
export class ModelTrainingPlatformController {
  constructor(private readonly platform: ModelTrainingPlatformService) {}

  @Get('engine')
  engine {
    return this.platform.engine;
  }

  @Get('methods')
  methods {
    return this.platform.methods;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.platform.overview(session);
  }

  @Get('experiments')
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession session: SessionContext) {
    return this.platform.listExperiments(session);
  }

  @Get('experiments/:id')
  @UseGuards(ClerkAuthGuard)
  get(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.platform.getExperiment(session, id);
  }

  @Post('experiments')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentSession session: SessionContext,
    @Body
    body: {
      method?: string;
      name?: string;
      baseModel?: string;
      sourceLang?: string;
      targetLang?: string;
      datasetRef?: string;
      hyperparams?: Record<string, unknown>;
      notes?: string;
    },
  ) {
    return this.platform.createExperiment(session, body);
  }

  @Post('experiments/:id/launch')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  launch(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.platform.launchExperiment(session, id);
  }

  @Post('experiments/:id/checkpoint')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  checkpoint(
    @CurrentSession session: SessionContext,
    @Param('id') id: string,
    @Body body: { index?: number; note?: string },
  ) {
    return this.platform.checkpointExperiment(session, id, body);
  }

  @Post('experiments/:id/cancel')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentSession session: SessionContext, @Param('id') id: string) {
    return this.platform.cancelExperiment(session, id);
  }

  @Get('monitoring')
  @UseGuards(ClerkAuthGuard)
  monitoring(@CurrentSession session: SessionContext) {
    return this.platform.monitoring(session);
  }
}
