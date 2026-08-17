export type TenantStatus = 'active' | 'suspended' | 'blocked';
export type LegalBasisStatus = 'pending' | 'confirmed' | 'revoked';

export const DEFAULT_LEGAL_BASIS_STATUS: LegalBasisStatus = 'pending';

export const isLegalBasisStatus = (value: string): value is LegalBasisStatus => {
  return value === 'pending' || value === 'confirmed' || value === 'revoked';
};

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  legalBasisStatus: LegalBasisStatus;
  createdAt: Date;
  updatedAt: Date;
}
