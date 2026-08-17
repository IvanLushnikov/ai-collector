export type CampaignStatus =
  | 'draft'
  | 'review'
  | 'ready'
  | 'running'
  | 'auto_paused'
  | 'completed'
  | 'archived';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  status: CampaignStatus;
  timezone: string;
  createdByUserId: string;
  telephonyConnectionId: string | null;
  dailyCallCap?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
