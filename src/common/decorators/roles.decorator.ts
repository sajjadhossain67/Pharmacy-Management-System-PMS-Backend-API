import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  CASHIER = 'cashier',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific roles.
 * Usage: @Roles(UserRole.ADMIN, UserRole.PHARMACIST)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
