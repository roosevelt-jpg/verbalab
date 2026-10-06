import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import type { Request } from 'express';
import { RegionsService } from './regions.service';
import { currentRegionCode } from './regions.catalog';
import type { SessionContext } from '../common/guards/clerk-auth.guard';
import type { TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { getHttpPair } from '../common/http/execution-request';

@Injectable()
export class ResidencyInterceptor implements NestInterceptor {
  constructor(private readonly regions: RegionsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { req, res } = getHttpPair(context);
    const request = req as Request & {
      sessionAuth?: SessionContext;
      translateAuth?: TranslateAuthContext;
    };
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-Lugemi-Region', currentRegionCode());
    }

    const organizationId =
      request.translateAuth?.organizationId ?? request.sessionAuth?.organizationId;
    if (!organizationId) {
      return next.handle();
    }

    return from(this.regions.assertOrgMatchesDeploy(organizationId)).pipe(
      switchMap(() => next.handle()),
    );
  }
}
