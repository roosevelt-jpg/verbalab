import { Controller, Get, Query } from '@nestjs/common';
import { ContinuousLearningService } from './continuous-learning.service';

@Controller('v1/continuous-learning')
export class ContinuousLearningController {
  constructor(private readonly service: ContinuousLearningService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('feedback')
  feedback(@Query('q') q?: string) {
    return this.service.feedback(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('promote-check')
  promoteCheck(@Query('id') id?: string) {
    if (!id) {
      return { error: 'id query parameter required' };
    }
    return this.service.promoteCheck(id);
  }

  @Get('promote')
  promote(@Query('id') id?: string) {
    if (!id) {
      return { error: 'id query parameter required' };
    }
    return this.service.promote(id);
  }
}
