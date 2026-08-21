import { Incident, Step, ActionLogEntry } from '../types';
import { INCIDENT_PLAYBOOKS } from './config';

export function seedPlaybookSteps(incidentId: number, incidentType: string): Step[] {
  const config = INCIDENT_PLAYBOOKS[incidentType as keyof typeof INCIDENT_PLAYBOOKS];
  if (!config) return [];

  return config.steps.map((s, index) => ({
    id: `step-${incidentId}-${index + 1}`,
    incident_id: incidentId,
    phase: s.phase,
    step_text: s.step_text,
    step_order: index + 1,
    done: false,
    done_at: null,
  }));
}

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 1.2 * 60 * 60 * 1000).toISOString();
const sixHoursAgo = new Date(now.getTime() - 6.8 * 60 * 60 * 1000).toISOString();
const oneDayAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
const containedOneDayAgo = new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString();
const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
const resolvedThreeDaysAgo = new Date(now.getTime() - 64 * 60 * 60 * 1000).toISOString();

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 1042,
    title: 'Suspicious Settlement Diversion via NIBSS Switch Channel 04',
    incident_type: 'payment_fraud',
    severity: 'critical',
    status: 'open',
    affected_systems: 'Core Switch, NIBSS Inbound Settlement Bridge, Merchant Tier-2 Webhooks',
    description:
      'Transaction monitoring flagged 14 batch settlement requests totaling ₦48.2M with spoofed checksums routing through an unverified merchant sub-account. Immediate containment initiated to isolate transaction batch queues.',
    customer_data_involved: true,
    card_data_involved: true,
    created_at: oneHourAgo,
    contained_at: null,
    resolved_at: null,
    steps: seedPlaybookSteps(1042, 'payment_fraud').map((step, idx) => {
      if (idx === 0) {
        return { ...step, done: true, done_at: new Date(now.getTime() - 50 * 60 * 1000).toISOString() };
      }
      if (idx === 1) {
        return { ...step, done: true, done_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString() };
      }
      return step;
    }),
    action_log: [
      {
        id: 'log-1042-1',
        incident_id: 1042,
        timestamp: oneHourAgo,
        author: 'SOC Auto-Ingest',
        note: 'Incident detected and logged via Fraud Engine Rule #FE-9902.',
      },
      {
        id: 'log-1042-2',
        incident_id: 1042,
        timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
        author: 'A. Balogun (Lead IR)',
        note: 'Suspended affected payment channel and severed webhook dispatchers.',
      },
      {
        id: 'log-1042-3',
        incident_id: 1042,
        timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        author: 'T. Adebayo (SecOps)',
        note: 'Placed hold on 3 beneficiary settlement accounts at tier-1 clearing.',
      },
    ],
  },
  {
    id: 1041,
    title: 'Credential Stuffing Wave on Mobile Banking USSD Gateway (*911#)',
    incident_type: 'account_takeover',
    severity: 'high',
    status: 'open',
    affected_systems: 'Telco USSD Gateway, Auth Session Broker, OTP Dispatch Server',
    description:
      'Distributed IP pool originating from rotating proxy egress nodes attempting rapid PIN brute-forcing against 1,200+ customer USSD sessions. 18 accounts show anomalous PIN reset sequences.',
    customer_data_involved: true,
    card_data_involved: false,
    created_at: sixHoursAgo,
    contained_at: null,
    resolved_at: null,
    steps: seedPlaybookSteps(1041, 'account_takeover').map((step, idx) => {
      if (idx <= 2) {
        return { ...step, done: true, done_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString() };
      }
      return step;
    }),
    action_log: [
      {
        id: 'log-1041-1',
        incident_id: 1041,
        timestamp: sixHoursAgo,
        author: 'E. Okafor (SOC Analyst)',
        note: 'Incident logged following USSD authentication failure threshold alert (>450 req/min).',
      },
      {
        id: 'log-1041-2',
        incident_id: 1041,
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        author: 'E. Okafor (SOC Analyst)',
        note: 'Forced session eviction and locked 18 compromised customer accounts. Temporary USSD rate-limit tightened.',
      },
    ],
  },
  {
    id: 1039,
    title: 'Third-Party SMS Gateway Webhook Key Leakage in Staging Sandbox',
    incident_type: 'vendor_compromise',
    severity: 'high',
    status: 'contained',
    affected_systems: 'Staging CI/CD Pipeline, SMS Provider Integration Endpoint',
    description:
      'Public git repository scanning identified an active vendor API token embedded in an outdated test harness. Vendor access was immediately revoked and re-keyed.',
    customer_data_involved: false,
    card_data_involved: false,
    created_at: oneDayAgo,
    contained_at: containedOneDayAgo,
    resolved_at: null,
    steps: seedPlaybookSteps(1039, 'vendor_compromise').map((step, idx) => {
      if (idx <= 3) {
        return { ...step, done: true, done_at: containedOneDayAgo };
      }
      return step;
    }),
    action_log: [
      {
        id: 'log-1039-1',
        incident_id: 1039,
        timestamp: oneDayAgo,
        author: 'GitGuardian Automated Alert',
        note: 'Token exposure detected in commit history of legacy vendor bridge repo.',
      },
      {
        id: 'log-1039-2',
        incident_id: 1039,
        timestamp: containedOneDayAgo,
        author: 'M. Sani (AppSec)',
        note: 'Revoked staging credential with SMS vendor and rotated master production keys as precaution.',
      },
    ],
  },
  {
    id: 1035,
    title: 'Volumetric UDP Flood against Public API Load Balancers',
    incident_type: 'ddos',
    severity: 'high',
    status: 'closed',
    affected_systems: 'Edge Cloudflare WAF, BGP Routing Anycast Pool, Core REST Gateway',
    description:
      '45 Gbps volumetric flood targeting banking API VIPs. Traffic scrubbed via upstream provider BGP reroute with zero customer transactions lost.',
    customer_data_involved: false,
    card_data_involved: false,
    created_at: threeDaysAgo,
    contained_at: resolvedThreeDaysAgo,
    resolved_at: resolvedThreeDaysAgo,
    steps: seedPlaybookSteps(1035, 'ddos').map((step) => ({
      ...step,
      done: true,
      done_at: resolvedThreeDaysAgo,
    })),
    action_log: [
      {
        id: 'log-1035-1',
        incident_id: 1035,
        timestamp: threeDaysAgo,
        author: 'Network Ops',
        note: 'DDoS mitigation provider activated under emergency playbook.',
      },
      {
        id: 'log-1035-2',
        incident_id: 1035,
        timestamp: resolvedThreeDaysAgo,
        author: 'K. Danladi (CISO)',
        note: 'Post-incident review completed. CBN notification filed within the 24h compliance window.',
      },
    ],
  },
];
