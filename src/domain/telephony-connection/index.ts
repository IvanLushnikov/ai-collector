export type TelephonyMode = 'sandbox' | 'production';
export type TelephonyStatus = 'active' | 'disabled' | 'invalid';

export interface TelephonyConnection {
  id: string;
  tenantId: string;
  provider: string;
  mode: TelephonyMode;
  status: TelephonyStatus;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}
