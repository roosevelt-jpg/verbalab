import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LanguageIntegrityService } from './language-integrity.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/language-integrity')
export class LanguageIntegrityController {
  constructor(private readonly service: LanguageIntegrityService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('protocol')
  protocol() {
    return this.service.protocol();
  }

  /** Public metadata verify — structural / demo claims without org context. */
  @Post('verify')
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
