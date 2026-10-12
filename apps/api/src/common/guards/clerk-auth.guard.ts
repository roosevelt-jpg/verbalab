import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { ApiException } from '../errors/api-exception';
import { IdentityService } from '../../identity/identity.service';
import { AuditService } from '../../audit/audit.service';
import { clientIp } from '../http/client-ip';
import { getHttpPair } from '../http/execution-request';
import { isPlatformAdmin } from '../admin/platform-admin';
import {
  getFirebaseAdminAuth,
  isFirebaseAdminConfigured,
} from '../auth/firebase-admin';

export type SessionContext = {
  userId: string;
  organizationId: string;
  workspaceId: string;
  clerkUserId: string;
  role: 'owner' | 'admin' | 'member';
  /** True when the caller is on the platform admin allowlist (full platform control). */
  platformAdmin?: boolean;
};

type ResolvedIdentity = {
  externalUserId: string;
  email?: string;
  name?: string;
  clerkOrgId?: string;
  clerkOrgRole?: string;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly identity: IdentityService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const firebaseReady = isFirebaseAdminConfigured();
    const clerkSecret = process.env.CLERK_SECRET_KEY;

    if (!firebaseReady && !clerkSecret) {
      throw new ApiException(
        'auth_not_configured',
        'Set FIREBASE_* (preferred) or CLERK_SECRET_KEY to enable console auth.',
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

    let resolved: ResolvedIdentity | null = null;

    // Prefer Firebase when configured — faster verify, no Clerk user fetch round-trip.
    if (firebaseReady) {
      resolved = await this.tryFirebase(token);
    }
    if (!resolved && clerkSecret) {
      resolved = await this.tryClerk(token, clerkSecret);
    }
    if (!resolved) {
      throw new ApiException('unauthorized', 'Invalid session token', HttpStatus.UNAUTHORIZED);
    }

    const preferredWorkspaceRaw = request.headers['x-lugemi-workspace-id'];
    const preferredWorkspaceId = Array.isArray(preferredWorkspaceRaw)
      ? preferredWorkspaceRaw[0]
      : preferredWorkspaceRaw;

    const preferredOrgRaw = request.headers['x-lugemi-organization-id'];
    const preferredOrganizationId = Array.isArray(preferredOrgRaw)
      ? preferredOrgRaw[0]
      : preferredOrgRaw;

    const geoRaw =
      request.headers['x-lugemi-registered-from'] ??
      request.headers['cf-ipcountry'] ??
      request.headers['x-vercel-ip-country'];
    const signupCountryRaw = Array.isArray(geoRaw) ? geoRaw[0] : geoRaw;
    const signupCountry =
      signupCountryRaw && signupCountryRaw !== 'XX' && signupCountryRaw !== 'T1'
        ? signupCountryRaw
        : undefined;

    const platformAdmin = isPlatformAdmin({
      email: resolved.email,
      clerkUserId: resolved.externalUserId,
    });

    const session = await this.identity.ensureSessionIdentity({
      clerkUserId: resolved.externalUserId,
      email: resolved.email,
      name: resolved.name,
      clerkOrgId: resolved.clerkOrgId,
      clerkOrgRole: resolved.clerkOrgRole,
      orgName: resolved.clerkOrgId ? undefined : 'Personal',
      preferredWorkspaceId: preferredWorkspaceId?.trim() || undefined,
      preferredOrganizationId: preferredOrganizationId?.trim() || undefined,
      platformAdmin,
      signupCountry,
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

  private async tryFirebase(token: string): Promise<ResolvedIdentity | null> {
    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
      return {
        externalUserId: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
    } catch {
      return null;
    }
  }

  private async tryClerk(token: string, secretKey: string): Promise<ResolvedIdentity | null> {
    try {
      const payload = await verifyToken(token, { secretKey });
      const clerkUserId = payload.sub;
      const orgClaim = payload.o as { id?: string; rol?: string } | undefined;
      const clerkOrgId = typeof orgClaim?.id === 'string' ? orgClaim.id : undefined;
      const clerkOrgRole = typeof orgClaim?.rol === 'string' ? orgClaim.rol : undefined;

      const clerk = createClerkClient({ secretKey });
      const user = await clerk.users.getUser(clerkUserId);
      const email = user.emailAddresses[0]?.emailAddress;
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;

      return {
        externalUserId: clerkUserId,
        email,
        name,
        clerkOrgId,
        clerkOrgRole,
      };
    } catch {
      return null;
    }
  }
}
