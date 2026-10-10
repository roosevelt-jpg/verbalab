import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/audit-events')
@UseGuards(ClerkAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@CurrentSession() session: SessionContext, @Query('limit') limitRaw?: string) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can view the audit log',
        HttpStatus.FORBIDDEN,
      );
    }

    const limit = limitRaw ? Number(limitRaw) : 50;
    return this.audit.listForOrg(session.organizationId, Number.isFinite(limit) ? limit : 50);
  }
}
