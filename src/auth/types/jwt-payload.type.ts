import { UserRole } from 'src/common/user-role.enum';

export type JwtPayload = {
    sub: string;
    email: string;
    role?: UserRole;
}