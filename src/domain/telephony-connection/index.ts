export type TelephonyMode = 'sandbox' | 'production';
export type TelephonyStatus = 'active' | 'disabled' | 'invalid';

export type TelephonyProbeCapabilities = {
  marking: boolean;
  recording: boolean;
  handoff: boolean;
  sandboxPass: boolean;
  checkedAt: Date;
};

export type StoredTelephonyProbeResult = {
  lastProbeAt: Date;
  probeMarking: boolean;
  probeRecording: boolean;
  probeHandoff: boolean;
};

export type TelephonyProbeSnapshot = {
  mode: TelephonyMode | string;
  lastProbeAt?: Date | string | null;
  probeMarking?: boolean | null;
  probeRecording?: boolean | null;
  probeHandoff?: boolean | null;
};

export interface TelephonyConnection {
  id: string;
  tenantId: string;
  provider: string;
  mode: TelephonyMode;
  status: TelephonyStatus;
  displayName: string;
  lastProbeAt: Date | null;
  probeMarking: boolean;
  probeRecording: boolean;
  probeHandoff: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const applyTelephonyProbeResult = (
  capabilities: TelephonyProbeCapabilities
): StoredTelephonyProbeResult => ({
  lastProbeAt: capabilities.checkedAt,
  probeMarking: capabilities.marking === true,
  probeRecording: capabilities.recording === true,
  probeHandoff: capabilities.handoff === true
});

export const isProductionTelephonyProbeConfirmed = (
  connection: TelephonyProbeSnapshot
): boolean => {
  if (connection.mode !== 'production') {
    return true;
  }

  return Boolean(
    connection.lastProbeAt
    && connection.probeMarking === true
    && connection.probeRecording === true
    && connection.probeHandoff === true
  );
};
