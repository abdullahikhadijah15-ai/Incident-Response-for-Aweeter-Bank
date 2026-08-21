export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'contained' | 'closed';
export type IncidentPhase = 'Containment' | 'Eradication' | 'Recovery' | 'Post-Incident';

export type IncidentTypeKey =
  | 'account_takeover'
  | 'payment_fraud'
  | 'data_breach'
  | 'ddos'
  | 'insider_threat'
  | 'vendor_compromise'
  | 'ransomware_malware';

export interface PlaybookStepTemplate {
  phase: IncidentPhase;
  step_text: string;
}

export interface IncidentTypeConfig {
  key: IncidentTypeKey;
  label: string;
  defaultSeverity: Severity;
  regulators: string[];
  steps: PlaybookStepTemplate[];
}

export interface Step {
  id: string;
  incident_id: number;
  phase: IncidentPhase;
  step_text: string;
  step_order: number;
  done: boolean;
  done_at: string | null; // ISO UTC string
}

export interface ActionLogEntry {
  id: string;
  incident_id: number;
  timestamp: string; // ISO UTC string
  note: string;
  author: string;
  tag?: 'containment' | 'forensics' | 'regulatory' | 'general' | 'escalation';
}

export interface Incident {
  id: number;
  title: string;
  incident_type: IncidentTypeKey;
  severity: Severity;
  status: IncidentStatus;
  affected_systems: string;
  description: string;
  customer_data_involved: boolean;
  card_data_involved: boolean;
  created_at: string; // ISO UTC string
  contained_at: string | null; // ISO UTC string
  resolved_at: string | null; // ISO UTC string
  steps?: Step[];
  action_log?: ActionLogEntry[];
}

export interface RegulatoryClock {
  regulator: string;
  hoursConfigured: number | null;
  deadlineIso: string | null;
  hoursRemaining: number | null;
  isBreached: boolean;
  isMet?: boolean;
}

export interface SLAMetrics {
  slaHours: number;
  slaDeadlineIso: string;
  hoursRemaining: number;
  percentRemaining: number;
  status: 'active' | 'met' | 'breached';
  color: string; // '#2DD4BF' | '#F2A93B' | '#E5484D'
  displayText: string;
  formattedTimeLeft: string;
}

export interface SOCOperator {
  id: string;
  name: string;
  callsign: string;
  role: string;
  tier: 'Tier 1 Analyst' | 'Tier 2 SecOps' | 'Tier 3 Incident Lead' | 'CISO / Exec';
  clearanceLevel: 'LEVEL 1' | 'LEVEL 2' | 'LEVEL 3' | 'COGNITIVE TOP SECRET';
  email: string;
  avatarInitials: string;
  badgeId: string;
}

export type CommsChannel =
  | 'war-room'
  | 'regulatory-liaison'
  | 'executive-brief'
  | 'customer-pr'
  | 'threat-intel';

export type CommsPriority = 'CRITICAL' | 'URGENT' | 'ROUTINE' | 'DIRECTIVE';

export interface CommsMessage {
  id: string;
  channel: CommsChannel;
  incidentId?: number;
  senderName: string;
  senderRole: string;
  senderBadge: string;
  priority: CommsPriority;
  timestamp: string; // ISO string
  content: string;
  regulatoryTag?: 'CBN-MANDATORY' | 'NDPR-BREACH' | 'NIBSS-ALERT' | 'BOARD-BRIEF' | 'INTERNAL-SOC';
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'ENCRYPTED';
}

