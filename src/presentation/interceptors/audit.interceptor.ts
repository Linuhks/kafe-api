import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: { id?: string };
    }>();

    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const userId: string = req.user?.id ?? 'anonymous';
    const action = `${req.method} ${req.url}`;
    const urlSegments = req.url.split('/');
    const v1Index = urlSegments.indexOf('v1');
    const entityType = v1Index !== -1 ? (urlSegments[v1Index + 1] ?? 'unknown') : (urlSegments[3] ?? 'unknown');
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      tap({
        next: () => {
          try {
            this.logger.log(
              JSON.stringify({ userId, action, entityType, outcome: 'success', timestamp }),
            );
          } catch {
            process.stderr.write(`audit log error at ${timestamp}\n`);
          }
        },
        error: (err: { status?: number }) => {
          try {
            const statusCode = err?.status ?? 500;
            this.logger.warn(
              JSON.stringify({
                userId,
                action,
                entityType,
                outcome: 'failure',
                statusCode,
                timestamp,
              }),
            );
          } catch {
            process.stderr.write(`audit log error at ${timestamp}\n`);
          }
        },
      }),
    );
  }
}
