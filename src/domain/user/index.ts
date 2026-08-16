export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  tenantId: string;
  roleId: string;
  email: string;
  name: string;
  status: UserStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
