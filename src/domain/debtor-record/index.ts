export type DebtStatus = 'active' | 'closed' | 'disputed' | 'bankruptcy' | 'contact_forbidden';
export type ConsentStatus = 'pending' | 'given' | 'revoked';

export interface DebtorRecord {
  id: string;
  tenantId: string;
  campaignId: string;
  externalId: string;
  phone: string;
  timezone?: string;
  debtAmount: number;
  debtStatus: DebtStatus;
  consentStatus: ConsentStatus;
  createdAt: Date;
  updatedAt: Date;
}
