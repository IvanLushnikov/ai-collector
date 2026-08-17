export type PromptStatus = 'draft' | 'active' | 'archived';

export interface PromptVersion {
  id: string;
  tenantId: string;
  campaignId: string;
  scriptVersionId: string | null;
  version: number;
  status: PromptStatus;
  content: string;
  contentHash: string;
  modelId: string;
  createdAt: Date;
}

export const isPromptStatus = (value: string): value is PromptStatus =>
  value === 'draft' || value === 'active' || value === 'archived';
