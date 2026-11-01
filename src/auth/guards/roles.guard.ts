import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Enforces @Roles(...) metadata.
 * No metadata = allow (existing behaviour: GETs public, writes need JWT).
 * Unknown/missing role on the JWT = programme_staff (backwards compatible).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role =
      (request.user as { role?: UserRole } | undefined)?.role ??
      UserRole.PROGRAMME_STAFF;
    if (!required.includes(role)) {
      throw new ForbiddenException('Insufficient role for this resource');
    }
    return true;
  }
}
