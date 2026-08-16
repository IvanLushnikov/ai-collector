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
  createdAt: Date;
  updatedAt: Date;
}
