import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { ApiException } from '../errors/api-exception';
import { IdentityService } from '../../identity/identity.service';
import { AuditService } from '../../audit/audit.service';
import { clientIp } from '../http/client-ip';
import { getHttpPair } from '../http/execution-request';

export type SessionContext = {
  userId: string;
  organizationId: string;
  workspaceId: string;
  clerkUserId: string;
  role: 'owner' | 'admin' | 'member';
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly identity: IdentityService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new ApiException(
        'auth_not_configured',
        'CLERK_SECRET_KEY is not set. Add Clerk keys to enable console auth.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const { req } = getHttpPair(context);
    const request = req as Request & { sessionAuth?: SessionContext };
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiException('unauthorized', 'Missing Bearer token', HttpStatus.UNAUTHORIZED);
    }

    const token = header.slice('Bearer '.length).trim();

    let clerkUserId: string;
    let email: string | undefined;
    let name: string | undefined;
    let clerkOrgId: string | undefined;
    let clerkOrgRole: string | undefined;

    try {
      const payload = await verifyToken(token, { secretKey });
      clerkUserId = payload.sub;
      const orgClaim = payload.o as { id?: string; rol?: string } | undefined;
      clerkOrgId = typeof orgClaim?.id === 'string' ? orgClaim.id : undefined;
      clerkOrgRole = typeof orgClaim?.rol === 'string' ? orgClaim.rol : undefined;

      const clerk = createClerkClient({ secretKey });
      const user = await clerk.users.getUser(clerkUserId);
      email = user.emailAddresses[0]?.emailAddress;
      name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
    } catch {
      throw new ApiException('unauthorized', 'Invalid session token', HttpStatus.UNAUTHORIZED);
    }

    const preferredWorkspaceRaw = request.headers['x-verbalab-workspace-id'];
    const preferredWorkspaceId = Array.isArray(preferredWorkspaceRaw)
      ? preferredWorkspaceRaw[0]
      : preferredWorkspaceRaw;

    const session = await this.identity.ensureSessionIdentity({
      clerkUserId,
      email,
      name,
      clerkOrgId,
      clerkOrgRole,
      orgName: clerkOrgId ? undefined : 'Personal',
      preferredWorkspaceId: preferredWorkspaceId?.trim() || undefined,
    });

    request.sessionAuth = session;

    void this.audit.recordSignInIfNeeded({
      organizationId: session.organizationId,
      userId: session.userId,
      route: request.method + ' ' + request.path,
      ip: clientIp(request),
    });

    return true;
  }
}
