import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/common/user-role.enum';

export const ROLES_KEY = 'roles';

/** Restrict a route to the given roles. Absence of metadata = all authenticated roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
