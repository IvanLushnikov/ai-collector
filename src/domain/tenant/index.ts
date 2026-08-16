export type TenantStatus = 'active' | 'suspended' | 'blocked';

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}
