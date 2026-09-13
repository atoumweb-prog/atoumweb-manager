export const TIME_CATEGORIES = [
  'production',
  'development',
  'design',
  'meeting',
  'support',
  'client_correction',
  'internal_correction',
  'research_training',
  'administrative',
  'other',
] as const;

export const TIME_SESSION_SOURCES = ['timer', 'manual', 'import'] as const;
export const TIME_RECOVERY_STALE_AFTER_SECONDS = 90;

export type TimeCategory = (typeof TIME_CATEGORIES)[number];
export type TimeSessionSource = (typeof TIME_SESSION_SOURCES)[number];

export interface StartTimeSessionInput {
  projectId?: string | null;
  projectNodeId?: string | null;
  category: TimeCategory;
  activityLabel?: string | null;
  billable?: boolean;
  note?: string | null;
}

export interface ManualTimeSessionInput extends StartTimeSessionInput {
  startedAt: string;
  endedAt: string;
}

export interface UpdateTimeSessionInput extends ManualTimeSessionInput {}

export interface TimeSessionPause {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt?: string | null;
}

export interface TimeSession {
  id: string;
  clientAccountId?: string | null;
  clientLabel?: string | null;
  projectId?: string | null;
  projectLabel?: string | null;
  projectNumber?: string | null;
  projectNodeId?: string | null;
  projectNodeLabel?: string | null;
  category: TimeCategory;
  activityLabel?: string | null;
  startedAt: string;
  endedAt?: string | null;
  billable: boolean;
  source: TimeSessionSource;
  note?: string | null;
  pauses: TimeSessionPause[];
  paused: boolean;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSessionFilters {
  from?: string | null;
  to?: string | null;
  clientAccountId?: string | null;
  projectId?: string | null;
  category?: TimeCategory | null;
  billable?: boolean | null;
}

export interface TimeSummary {
  totalSeconds: number;
  billableSeconds: number;
  nonBillableSeconds: number;
  sessionCount: number;
}

export interface TimeApi {
  active(): Promise<TimeSession | null>;
  start(input: StartTimeSessionInput): Promise<TimeSession>;
  switchTo(input: StartTimeSessionInput): Promise<TimeSession>;
  heartbeat(id: string): Promise<TimeSession>;
  pause(id: string): Promise<TimeSession>;
  resume(id: string): Promise<TimeSession>;
  recoverResume(id: string): Promise<TimeSession>;
  stop(id: string): Promise<TimeSession>;
  stopAtLastKnown(id: string): Promise<TimeSession>;
  addManual(input: ManualTimeSessionInput): Promise<TimeSession>;
  update(id: string, input: UpdateTimeSessionInput): Promise<TimeSession>;
  list(filters?: TimeSessionFilters): Promise<TimeSession[]>;
  summary(filters?: TimeSessionFilters): Promise<TimeSummary>;
}
