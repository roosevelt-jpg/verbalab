import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get('summary')
  @UseGuards(ClerkAuthGuard)
  summary(@CurrentSession session: SessionContext) {
    return this.usage.summary(session.organizationId);
  }
}
