export const LLM_TOOLS = [
  'set_outcome',
  'request_handoff',
  'schedule_callback',
  'end_call',
  'confirm_ptp'
] as const;

export type LlmToolName = (typeof LLM_TOOLS)[number];

export type LlmToolCall = {
  name: LlmToolName;
  arguments: Record<string, unknown>;
};

export const isLlmToolName = (value: string): value is LlmToolName =>
  (LLM_TOOLS as readonly string[]).includes(value);

export class IdentityGateError extends Error {
  constructor() {
    super('confirm_ptp is not allowed until identityVerified=true');
    this.name = 'IdentityGateError';
  }
}

export const assertToolAllowed = (
  tool: LlmToolName,
  context: { identityVerified: boolean }
): void => {
  if (tool === 'confirm_ptp' && context.identityVerified !== true) {
    throw new IdentityGateError();
  }
};
