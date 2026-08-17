import { env } from '../config/env.js';

export const shouldEnqueueSandboxCall = (
  flag: boolean = env.SANDBOX_CALLS_QUEUE_ENABLED
): boolean => flag === true;
