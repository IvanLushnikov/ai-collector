import { LlmToolName } from './llm/tools.js';

export const DIALOGUE_STATES = [
  'identity',
  'disclosure',
  'purpose',
  'ptp_or_decline',
  'confirm',
  'end',
  'handoff'
] as const;

export type DialogueState = (typeof DIALOGUE_STATES)[number];

export type DialogueEvent =
  | { type: 'user_said'; text: string }
  | { type: 'tool_result'; tool: LlmToolName; ok: boolean }
  | { type: 'handoff_requested' };

export type DialogueSession = {
  state: DialogueState;
  identityVerified: boolean;
  debtAmount: number;
};

export type LlmTurnPayload = {
  stateId: DialogueState;
  identityVerified: boolean;
  userText: string;
  debtAmount?: number;
};

export const buildLlmTurnPayload = (
  session: DialogueSession,
  userText: string
): LlmTurnPayload => {
  const payload: LlmTurnPayload = {
    stateId: session.state,
    identityVerified: session.identityVerified,
    userText
  };

  if (session.identityVerified && session.state !== 'identity' && session.state !== 'disclosure') {
    payload.debtAmount = session.debtAmount;
  }

  return payload;
};

const nextAfterIdentity = (session: DialogueSession): DialogueState =>
  session.identityVerified ? 'disclosure' : 'identity';

export const transitionDialogue = (
  session: DialogueSession,
  event: DialogueEvent
): DialogueState => {
  if (event.type === 'handoff_requested') {
    return 'handoff';
  }

  if (event.type === 'tool_result' && event.tool === 'request_handoff') {
    return 'handoff';
  }

  if (event.type === 'tool_result' && event.tool === 'end_call') {
    return 'end';
  }

  if (session.state === 'identity') {
    if (event.type === 'tool_result' && event.ok) {
      return nextAfterIdentity({ ...session, identityVerified: true });
    }
    return 'identity';
  }

  if (session.state === 'disclosure') {
    if (!session.identityVerified) {
      return 'identity';
    }
    if (event.type === 'user_said' || (event.type === 'tool_result' && event.ok)) {
      return 'purpose';
    }
  }

  if (session.state === 'purpose') {
    if (!session.identityVerified) {
      return 'identity';
    }
    return 'ptp_or_decline';
  }

  if (session.state === 'ptp_or_decline') {
    if (event.type === 'tool_result' && event.tool === 'schedule_callback') {
      return 'end';
    }
    if (event.type === 'tool_result' && event.tool === 'confirm_ptp') {
      return session.identityVerified ? 'confirm' : 'identity';
    }
    if (event.type === 'user_said') {
      return 'confirm';
    }
  }

  if (session.state === 'confirm') {
    if (!session.identityVerified) {
      return 'identity';
    }
    if (event.type === 'tool_result' && event.tool === 'confirm_ptp' && event.ok) {
      return 'end';
    }
  }

  return session.state;
};
