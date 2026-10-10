import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { LanguageIntegrityService } from './language-integrity.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/language-integrity')
export class LanguageIntegrityController {
  constructor(private readonly service: LanguageIntegrityService) {}

  /** Public catalog probe — no auth. Studio Language Integrity panel. */
  @Get('engine')
  engine() {
    return this.service.engine();
  }

  /** Public government adoption protocol checklist. */
  @Get('protocol')
  protocol() {
    return this.service.protocol();
  }

  /** Public metadata verify — structural / demo claims without org context. */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @Body()
    body: {
      claimType?: string;
      cloneId?: string;
      watermarkHeader?: string;
      consentAttested?: boolean;
      ownershipAttested?: boolean;
      audioClaimText?: string;
      attestationNotes?: string;
    },
  ) {
    return this.service.verify(body ?? {});
  }

  /** Workspace-bound verify — resolves clone library when cloneId is supplied. */
  @Post('verify/workspace')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  verifyWorkspace(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      claimType?: string;
      cloneId?: string;
      watermarkHeader?: string;
      consentAttested?: boolean;
      ownershipAttested?: boolean;
      audioClaimText?: string;
      attestationNotes?: string;
    },
  ) {
    return this.service.verify({
      ...(body ?? {}),
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
    });
  }
}
