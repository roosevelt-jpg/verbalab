import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { EvalService, type EvalRunMode } from './eval.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1')
export class CoverageController {
  constructor(private readonly evalService: EvalService) {}

  /** Public coverage matrix — honest status, no leadership claims. */
  @Get('coverage')
  coverage() {
    return this.evalService.coverageMatrix();
  }

  /**
   * Run golden eval (owner/admin). Default mode=fixture uses the active gateway
   * provider (tests inject a fixture). mode=live requires a real vendor key.
   */
  @Post('eval/run')
  @UseGuards(ClerkAuthGuard)
  async run(
    @CurrentSession() session: SessionContext,
    @Query('mode') modeRaw?: string,
  ) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required',
        HttpStatus.FORBIDDEN,
      );
    }
    const mode = (modeRaw ?? 'fixture') as EvalRunMode;
    if (mode !== 'fixture' && mode !== 'live' && mode !== 'reference_oracle') {
      throw new ApiException(
        'validation_error',
        'mode must be fixture, live, or reference_oracle',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (mode === 'live' && process.env.EVAL_LIVE !== '1') {
      throw new ApiException(
        'eval_live_disabled',
        'Set EVAL_LIVE=1 to run live vendor eval (incurs MT cost).',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.evalService.runAll(mode === 'live' ? 'live' : mode);
  }
}
