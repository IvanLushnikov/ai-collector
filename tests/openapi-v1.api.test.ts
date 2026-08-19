import { describe, expect, it } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('OpenAPI v1 contract', () => {
  it('publishes versioned public routes and the common error envelope', async () => {
    const app = createApp({ campaignStore: {} });
    await app.ready();
    const response = await app.inject({ method: 'GET', url: '/openapi/v1.json' });
    expect(response.statusCode).toBe(200);
    const contract = response.json();
    expect(contract.openapi).toBe('3.1.0');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/status'].patch.operationId).toBe('updateCampaignStatus');
    expect(contract.paths['/tenants/{tenantId}/campaigns'].post.operationId).toBe('createCampaign');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/calls'].get.operationId).toBe('listCampaignCalls');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/calls/{callAttemptId}'].get.operationId).toBe('getCampaignCall');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/audit-logs'].get.operationId).toBe('listCampaignAuditLogs');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/readiness-summary'].get.operationId).toBe('getCampaignReadiness');
    expect(contract.paths['/tenants/{tenantId}/campaigns/{campaignId}/report'].get.operationId).toBe('getCampaignReport');
    expect(contract.components.responses.Error.content['application/json'].schema.required).toEqual(['error']);
    await app.close();
  });
});
