export type ScriptStatus = 'draft' | 'active' | 'archived';

export interface ScriptVersion {
  id: string;
  tenantId: string;
  campaignId: string;
  version: number;
  status: ScriptStatus;
  content: string;
  createdByUserId: string;
  createdAt: Date;
}
