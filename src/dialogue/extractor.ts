import { IdentityGateError } from './llm/tools.js';
import type { CallResultOutcome } from '../domain/call-result/index.js';

export type ExtractorToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ExtractedCallResult = {
  outcome: CallResultOutcome;
  ptpAmount?: number;
  ptpDate?: Date;
  reason?: string;
};

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
};

export const extractCallResultFromToolCall = (
  toolCall: ExtractorToolCall | null | undefined,
  context: { identityVerified: boolean }
): ExtractedCallResult | null => {
  if (!toolCall || typeof toolCall.name !== 'string') {
    return null;
  }

  if (toolCall.name === 'confirm_ptp') {
    if (context.identityVerified !== true) {
      throw new IdentityGateError();
    }
    const ptpAmount = asFiniteNumber(toolCall.arguments?.ptpAmount ?? toolCall.arguments?.amount);
    const rawDate = toolCall.arguments?.ptpDate ?? toolCall.arguments?.date;
    const ptpDate = typeof rawDate === 'string' && !Number.isNaN(Date.parse(rawDate))
      ? new Date(rawDate)
      : undefined;
    if (ptpAmount === undefined) {
      return {
        outcome: 'ptp_created',
        reason: typeof toolCall.arguments?.reason === 'string' ? toolCall.arguments.reason : undefined
      };
    }
    return {
      outcome: 'ptp_created',
      ptpAmount,
      ptpDate,
      reason: typeof toolCall.arguments?.reason === 'string' ? toolCall.arguments.reason : undefined
    };
  }

  if (toolCall.name === 'request_handoff') {
    return {
      outcome: 'handoff',
      reason: typeof toolCall.arguments?.reason === 'string' ? toolCall.arguments.reason : undefined
    };
  }

  if (toolCall.name === 'set_outcome') {
    const outcome = toolCall.arguments?.outcome;
    if (outcome === 'dispute' || outcome === 'callback_requested' || outcome === 'wrong_number') {
      return {
        outcome,
        reason: typeof toolCall.arguments?.reason === 'string' ? toolCall.arguments.reason : undefined
      };
    }
  }

  if (toolCall.name === 'end_call') {
    return {
      outcome: 'error',
      reason: typeof toolCall.arguments?.reason === 'string' ? toolCall.arguments.reason : 'ended'
    };
  }

  return null;
};
