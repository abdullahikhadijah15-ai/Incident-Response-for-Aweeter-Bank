import { CommsMessage } from '../types';

export const INITIAL_COMMS: CommsMessage[] = [
  {
    id: 'msg-01',
    channel: 'war-room',
    incidentId: 1042,
    senderName: 'Khadijah Abdullahi',
    senderRole: 'Lead Incident Commander',
    senderBadge: 'SOC-8821',
    priority: 'CRITICAL',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    content:
      '🚨 [WAR-ROOM DIRECTIVE] IR-1042: Switch Channel 04 isolated. Outbound clearing holds enforced on 3 settlement accounts. All Tier-2 merchant webhooks severed.',
    regulatoryTag: 'INTERNAL-SOC',
    status: 'ACKNOWLEDGED',
  },
  {
    id: 'msg-02',
    channel: 'regulatory-liaison',
    incidentId: 1042,
    senderName: 'Zainab Bello, Esq.',
    senderRole: 'Regulatory & Data Protection Counsel',
    senderBadge: 'REG-1102',
    priority: 'CRITICAL',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    content:
      '🏛️ [CBN COMPLIANCE NOTICE] Preliminary 24-hour statutory incident notification draft prepared for Central Bank of Nigeria Banking Supervision Dept. Loss estimate pegged at ₦48.2M with zero retail customer ledger impact.',
    regulatoryTag: 'CBN-MANDATORY',
    status: 'DISPATCHED',
  },
  {
    id: 'msg-03',
    channel: 'war-room',
    incidentId: 1041,
    senderName: 'Emmanuel Okafor',
    senderRole: 'SecOps & Cloud Infrastructure Engineer',
    senderBadge: 'SOC-7419',
    priority: 'URGENT',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content:
      '🔒 [USSD DEFENSE] IR-1041: Telco USSD gateway PIN rate-limits clamped to 3 attempts/hour. 18 targeted accounts locked pending customer KYC re-verification.',
    regulatoryTag: 'INTERNAL-SOC',
    status: 'DISPATCHED',
  },
  {
    id: 'msg-04',
    channel: 'executive-brief',
    incidentId: 1042,
    senderName: 'Dr. Kabir Danladi',
    senderRole: 'Chief Information Security Officer',
    senderBadge: 'EXEC-0004',
    priority: 'DIRECTIVE',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    content:
      '📊 [EXECUTIVE SITREP TO BOARD] Board Risk Committee informed. Core banking ledger remains pristine. Zero unauthorized fund exfiltration confirmed across main vaults.',
    regulatoryTag: 'BOARD-BRIEF',
    status: 'ENCRYPTED',
  },
  {
    id: 'msg-05',
    channel: 'customer-pr',
    incidentId: 1041,
    senderName: 'Corporate Communications Desk',
    senderRole: 'Crisis PR & Media Relations',
    senderBadge: 'PR-401',
    priority: 'ROUTINE',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    content:
      '📢 [CUSTOMER CARE HOLD STATEMENT] Inbound contact center script updated with reassurance messaging regarding temporary *911# security maintenance.',
    regulatoryTag: 'INTERNAL-SOC',
    status: 'DISPATCHED',
  },
];

export const COMMS_TEMPLATES = [
  {
    id: 'cbn-statutory',
    title: 'CBN Statutory Cyber Incident Dispatch (24h)',
    channel: 'regulatory-liaison' as const,
    priority: 'CRITICAL' as const,
    regulatoryTag: 'CBN-MANDATORY' as const,
    template: (incidentId: number, title: string, systems: string) =>
      `FORMAL NOTIFICATION TO CENTRAL BANK OF NIGERIA (CBN)
Reference: AWEETER-CBN-IR-${incidentId}
Circular Ref: BSD/DIR/GEN/LAB/014
Institution: Aweeter Bank PLC
Incident: IR-${incidentId} - ${title}
Affected Systems: ${systems}
Status: Containment active. Forensic preservation underway.
Classification: Statutory 24-Hour Mandatory Disclosure
Lead Contact: Zainab Bello, Esq. (SOC Regulatory Liaison / DPO)`,
  },
  {
    id: 'ndpr-breach',
    title: 'NDPR / NDPC 72-Hour Data Breach Notice',
    channel: 'regulatory-liaison' as const,
    priority: 'CRITICAL' as const,
    regulatoryTag: 'NDPR-BREACH' as const,
    template: (incidentId: number, title: string) =>
      `NIGERIA DATA PROTECTION COMMISSION (NDPC) FORMAL BREACH FILING
Reference: AWEETER-NDPC-IR-${incidentId}
Article: Nigeria Data Protection Act (NDPA) Section 40
Institution: Aweeter Bank PLC
Incident: IR-${incidentId} - ${title}
Data Subject Impact Assessment: Containment active; audit of exposed records in progress.
Remedial Measures: Access keys revoked, forensic disk image captured, zero persistent backdoors confirmed.
Data Protection Officer: Zainab Bello, Esq. (dpo@aweeterbank.com)`,
  },
  {
    id: 'exec-sitrep',
    title: 'Executive CISO / Board Situation Report',
    channel: 'executive-brief' as const,
    priority: 'DIRECTIVE' as const,
    regulatoryTag: 'BOARD-BRIEF' as const,
    template: (incidentId: number, title: string, systems: string) =>
      `EXECUTIVE INCIDENT SITUATION REPORT (SITREP)
To: Board Risk Committee, Managing Director & CISO
From: SOC Incident Commander (Khadijah Abdullahi)
Incident: IR-${incidentId} - ${title}
Operational Impact: Systems [${systems}] under controlled quarantine.
Financial Exposure: Insured & contained under reserve protocols.
Next Milestone: Root-cause eradication & clearance for production restore.`,
  },
  {
    id: 'pr-holding',
    title: 'Crisis PR & Customer Media Hold Statement',
    channel: 'customer-pr' as const,
    priority: 'ROUTINE' as const,
    regulatoryTag: 'INTERNAL-SOC' as const,
    template: (incidentId: number, title: string) =>
      `AWEETER BANK PUBLIC STATEMENT / CUSTOMER ADVISORY
Subject: System Maintenance & Security Enhancements
Context: IR-${incidentId}
Statement: "Aweeter Bank is performing scheduled security hardening across selected digital channels. All customer deposits and accounts remain fully secure and protected. Our digital platforms continue to operate with enhanced security verification."`,
  },
  {
    id: 'nibss-hold',
    title: 'NIBSS Settlement Bridge Quarantine Request',
    channel: 'war-room' as const,
    priority: 'CRITICAL' as const,
    regulatoryTag: 'NIBSS-ALERT' as const,
    template: (incidentId: number) =>
      `INTER-BANK CLEARING & SWITCH NOTICE (NIBSS / SCHEME OPERATORS)
Priority: High / Settlement Hold
Incident: IR-${incidentId}
Action Required: Place temporary settlement hold on flagged session tokens and merchant transaction batches.
SOC Hotline: +234 1 888 2400 (Aweeter Bank SOC Command)`,
  },
];
