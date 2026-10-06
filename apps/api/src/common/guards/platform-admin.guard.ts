import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from './clerk-auth.guard';
import { ApiException } from '../errors/api-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { isPlatformAdmin } from '../admin/platform-admin';

@Injectable
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly clerk: ClerkAuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.clerk.canActivate(context);
    const request = context.switchToHttp.getRequest<{ sessionAuth?: SessionContext }>;
    const session = request.sessionAuth;
    if (!session) {
      throw new ApiException('unauthorized', 'Missing session', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, clerkUserId: true },
    });

    if (
      !isPlatformAdmin({
        email: user?.email,
        clerkUserId: user?.clerkUserId ?? session.clerkUserId,
      })
    ) {
      throw new ApiException(
        'forbidden',
        'Platform admin access required',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
