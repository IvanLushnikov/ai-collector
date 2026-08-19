const error = { $ref: '#/components/responses/Error' };

export const openApiV1 = {
  openapi: '3.1.0', info: { title: 'AI Collector API', version: '1.0.0' }, servers: [{ url: '/' }],
  paths: {
    '/auth/register': { post: { operationId: 'register', responses: { '201': { description: 'Registered and authenticated' }, '400': error, '409': error } } },
    '/auth/login': { post: { operationId: 'login', responses: { '200': { description: 'Authenticated' }, '401': error } } },
    '/auth/logout': { post: { operationId: 'logout', responses: { '204': { description: 'Logged out' } } } },
    '/auth/me': { get: { operationId: 'getCurrentSession', responses: { '200': { description: 'Session state' } } } },
    '/tenants/{tenantId}/campaigns': {
      get: { operationId: 'listCampaigns', parameters: [{ $ref: '#/components/parameters/TenantId' }], responses: { '200': { description: 'Campaign page' }, '401': error, '403': error } },
      post: { operationId: 'createCampaign', parameters: [{ $ref: '#/components/parameters/TenantId' }], responses: { '201': { description: 'Created campaign' }, '400': error, '401': error, '403': error } }
    },
    '/tenants/{tenantId}/campaigns/{campaignId}/status': { patch: { operationId: 'updateCampaignStatus', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['draft', 'review', 'ready', 'running', 'manual_paused', 'auto_paused', 'completed', 'archived'] } } } } } }, responses: { '200': { description: 'Updated campaign' }, '400': error, '401': error, '403': error, '409': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/scripts': { get: { operationId: 'listScriptVersions', responses: { '200': { description: 'Scripts' } } }, post: { operationId: 'createScriptVersion', responses: { '201': { description: 'Created script version' }, '400': error, '409': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/debtors/import': { post: { operationId: 'importDebtors', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], responses: { '202': { description: 'Import accepted' }, '400': error, '401': error, '403': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/debtors/{debtorRecordId}/calls/sandbox': { post: { operationId: 'startSandboxCall', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }, { $ref: '#/components/parameters/DebtorRecordId' }, { $ref: '#/components/parameters/IdempotencyKey' }], responses: { '200': { description: 'Idempotent replay' }, '201': { description: 'Call started' }, '400': error, '403': error, '409': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/calls': { get: { operationId: 'listCampaignCalls', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], responses: { '200': { description: 'Call page' }, '400': error, '401': error, '403': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/calls/{callAttemptId}': { get: { operationId: 'getCampaignCall', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }, { $ref: '#/components/parameters/CallAttemptId' }], responses: { '200': { description: 'Call evidence' }, '404': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/audit-logs': { get: { operationId: 'listCampaignAuditLogs', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], responses: { '200': { description: 'Audit log page' }, '401': error, '403': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/readiness-summary': { get: { operationId: 'getCampaignReadiness', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], responses: { '200': { description: 'Readiness summary' }, '404': error } } },
    '/tenants/{tenantId}/campaigns/{campaignId}/report': { get: { operationId: 'getCampaignReport', parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/CampaignId' }], responses: { '200': { description: 'Campaign report' }, '401': error, '403': error, '404': error } } }
  },
  components: {
    parameters: {
      TenantId: { name: 'tenantId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      CampaignId: { name: 'campaignId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      DebtorRecordId: { name: 'debtorRecordId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      CallAttemptId: { name: 'callAttemptId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      IdempotencyKey: { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', minLength: 8, maxLength: 128 } }
    },
    responses: { Error: { description: 'Machine-readable API error', content: { 'application/json': { schema: { type: 'object', required: ['error'], properties: { error: { type: 'string' }, message: { type: 'string' }, issues: { type: 'array', items: {} } } } } } } }
  }
} as const;
