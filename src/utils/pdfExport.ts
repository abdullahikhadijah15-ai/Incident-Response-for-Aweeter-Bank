import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident } from '../types';
import { calculateRegulatoryClocks, calculateSLAMetrics, formatUtcDateTime } from './slaCalculator';
import { INCIDENT_PLAYBOOKS } from '../data/config';

/**
 * Generates an official Single-Incident Executive PDF Report
 */
export function generateIncidentPdf(incident: Incident): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const config = INCIDENT_PLAYBOOKS[incident.incident_type];
  const slaMetrics = calculateSLAMetrics(incident);
  const regClocks = calculateRegulatoryClocks(incident);

  // Background header band
  doc.setFillColor(11, 18, 32); // #0B1220
  doc.rect(0, 0, 210, 32, 'F');

  // Brand and Title
  doc.setTextColor(242, 169, 59); // Amber
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('AWEETER/IR - INCIDENT RESPONSE', 14, 12);

  doc.setTextColor(232, 234, 237);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SECURITY OPERATIONS CENTER · OFFICIAL INCIDENT REPORT', 14, 20);

  doc.setTextColor(154, 165, 184);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(
    `CLASSIFICATION: STRICTLY CONFIDENTIAL // REF: IR-${incident.id} // GENERATED: ${formatUtcDateTime(
      new Date().toISOString()
    )}`,
    14,
    27
  );

  let currentY = 38;

  // Incident Title & Header Callout
  doc.setTextColor(19, 27, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Incident #${incident.id}: ${incident.title}`, 14, currentY);
  currentY += 6;

  // Key stats bar
  doc.setDrawColor(34, 48, 85);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, currentY, 182, 12, 1, 1, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 90, 105);
  doc.text('TYPE:', 18, currentY + 7);
  doc.setTextColor(19, 27, 46);
  doc.text(config?.label || incident.incident_type, 30, currentY + 7);

  doc.setTextColor(80, 90, 105);
  doc.text('SEVERITY:', 95, currentY + 7);
  doc.setTextColor(
    incident.severity === 'critical' ? 229 : incident.severity === 'high' ? 242 : 19,
    incident.severity === 'critical' ? 72 : 100,
    77
  );
  doc.text(incident.severity.toUpperCase(), 113, currentY + 7);

  doc.setTextColor(80, 90, 105);
  doc.text('STATUS:', 145, currentY + 7);
  doc.setTextColor(
    incident.status === 'contained' ? 45 : incident.status === 'open' ? 242 : 100,
    incident.status === 'contained' ? 160 : 120,
    100
  );
  doc.text(incident.status.toUpperCase(), 160, currentY + 7);

  currentY += 16;

  // Section 1: Incident Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(19, 27, 46);
  doc.text('1. Incident Parameters & Timestamps', 14, currentY);
  currentY += 2;

  const summaryData = [
    ['Incident ID', `IR-${incident.id}`, 'Containment SLA Target', `${slaMetrics.slaHours} Hours`],
    [
      'Created Timestamp',
      formatUtcDateTime(incident.created_at),
      'Containment Status',
      incident.contained_at
        ? `Contained (${formatUtcDateTime(incident.contained_at)})`
        : 'In Progress (Open)',
    ],
    [
      'Contained Timestamp',
      formatUtcDateTime(incident.contained_at),
      'Resolution Status',
      incident.resolved_at
        ? `Closed (${formatUtcDateTime(incident.resolved_at)})`
        : 'Pending Full Resolution',
    ],
    [
      'Customer PII Involved',
      incident.customer_data_involved ? 'YES (Confirmed)' : 'NO / Not Impacted',
      'Cardholder / Payment Data',
      incident.card_data_involved ? 'YES (Confirmed)' : 'NO / Not Impacted',
    ],
    [
      'Affected Systems',
      incident.affected_systems || 'None specified',
      'SLA Outcome',
      slaMetrics.displayText,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 40, 55] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 243, 248], cellWidth: 42 },
      1: { cellWidth: 49 },
      2: { fontStyle: 'bold', fillColor: [240, 243, 248], cellWidth: 42 },
      3: { cellWidth: 49 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // Section 2: Executive Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(19, 27, 46);
  doc.text('2. Incident Description & Initial Vector', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 60, 75);
  const descLines = doc.splitTextToSize(
    incident.description || 'No detailed description recorded.',
    182
  );
  doc.text(descLines, 14, currentY);
  currentY += descLines.length * 4.2 + 6;

  // Section 3: Regulatory Compliance Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(19, 27, 46);
  doc.text('3. Regulatory Notification Compliance Matrix', 14, currentY);
  currentY += 2;

  const regRows = regClocks.map((c) => {
    return [
      c.regulator,
      c.hoursConfigured !== null ? `${c.hoursConfigured}h Window` : 'Ad-hoc / Internal',
      formatUtcDateTime(c.deadlineIso),
      c.hoursConfigured === null
        ? 'N/A (Internal Coordination)'
        : c.isBreached
        ? `BREACHED (-${Math.abs(c.hoursRemaining || 0).toFixed(1)}h)`
        : `${(c.hoursRemaining || 0).toFixed(1)}h Remaining`,
      c.isBreached ? 'NON-COMPLIANT' : 'ON TRACK / FILED',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Regulator / Scheme',
        'Mandated Window',
        'Statutory Deadline (UTC)',
        'Time Remaining',
        'Compliance Status',
      ],
    ],
    body: regRows.length > 0 ? regRows : [['None Applicable', '—', '—', '—', 'COMPLIANT']],
    theme: 'striped',
    headStyles: { fillColor: [19, 27, 46], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.2 },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // Section 4: Incident Playbook Execution
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(19, 27, 46);
  doc.text('4. Playbook Execution Checklist (Phase Breakdown)', 14, currentY);
  currentY += 2;

  const playbookRows = (incident.steps || []).map((step) => [
    `#${step.step_order}`,
    step.phase.toUpperCase(),
    step.step_text,
    step.done ? 'COMPLETED' : 'PENDING',
    formatUtcDateTime(step.done_at),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Step', 'Phase', 'Action / Requirement', 'State', 'Completed At (UTC)']],
    body: playbookRows,
    theme: 'grid',
    headStyles: { fillColor: [19, 27, 46], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 84 },
      3: { cellWidth: 22, fontStyle: 'bold' },
      4: { cellWidth: 38 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // Section 5: Action Log Timeline
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(19, 27, 46);
  doc.text('5. Forensic Action Log & Communications Timeline', 14, currentY);
  currentY += 2;

  const logRows = (incident.action_log || []).map((log) => [
    formatUtcDateTime(log.timestamp),
    log.author,
    log.note,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Timestamp (UTC)', 'Operator / System', 'Action / Finding Note']],
    body: logRows.length > 0 ? logRows : [['—', '—', 'No logged notes']],
    theme: 'striped',
    headStyles: { fillColor: [19, 27, 46], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 102 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  currentY = doc.lastAutoTable.finalY + 12;

  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }

  // Signoff Box
  doc.setDrawColor(180, 190, 205);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 22, 1, 1, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(90, 100, 115);
  doc.text(
    'Aweeter Bank Information Security & Incident Response Management · Aweeter/IR System of Record\n' +
      'Note: Regulatory deadlines are computed baseline figures subject to final CBN/NDPR compliance validation.\n' +
      'Incident Sign-off: Security Operations Lead ___________________   CISO / Head of Risk ___________________',
    18,
    currentY + 6
  );

  // Save/Download PDF
  const filename = `Aweeter-IR-${incident.id}-${incident.incident_type}-Report.pdf`;
  doc.save(filename);
}

/**
 * Generates an Executive Master Summary PDF Report across ALL incidents
 */
export function generateSocSummaryPdf(incidents: Incident[], simulatedNow?: Date): void {
  const now = simulatedNow || new Date();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header band
  doc.setFillColor(11, 18, 32);
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(242, 169, 59);
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('AWEETER/IR · SECURITY OPERATIONS CENTER', 14, 11);

  doc.setTextColor(232, 234, 237);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EXECUTIVE INCIDENT RESPONSE MASTER SUMMARY REPORT', 14, 18);

  doc.setTextColor(154, 165, 184);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(
    `AUDIT TIMEFRAME: ACTIVE REPOSITORY // REPORT GENERATED: ${formatUtcDateTime(
      now.toISOString()
    )} // TOTAL INCIDENTS: ${incidents.length}`,
    14,
    24
  );

  // High-Level KPIs
  const openCount = incidents.filter((i) => i.status === 'open').length;
  const containedCount = incidents.filter((i) => i.status === 'contained').length;
  const closedCount = incidents.filter((i) => i.status === 'closed').length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status === 'open').length;
  const highCount = incidents.filter((i) => i.severity === 'high' && i.status === 'open').length;

  let currentY = 34;

  // KPI boxes
  const boxWidth = 50;
  const kpiData = [
    { label: 'OPEN INCIDENTS', val: openCount.toString(), sub: `${criticalCount} Critical, ${highCount} High` },
    { label: 'CONTAINED INCIDENTS', val: containedCount.toString(), sub: 'Active Eradication' },
    { label: 'RESOLVED / CLOSED', val: closedCount.toString(), sub: 'Post-IR Review Complete' },
    { label: 'TOTAL IR RECORDS', val: incidents.length.toString(), sub: 'System of Record' },
    { label: 'REGULATORY CLOCKS', val: 'CBN / NDPR / NIBSS', sub: 'Statutory Windows Tracked' },
  ];

  kpiData.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 5);
    doc.setDrawColor(34, 48, 85);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, currentY, boxWidth, 16, 1, 1, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 125);
    doc.text(kpi.label, x + 3, currentY + 4.5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(19, 27, 46);
    doc.text(kpi.val, x + 3, currentY + 10);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 145);
    doc.text(kpi.sub, x + 3, currentY + 14);
  });

  currentY += 22;

  // Master Incident Inventory Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(19, 27, 46);
  doc.text('INCIDENT INVENTORY & CONTAINMENT SLA AUDIT LEDGER', 14, currentY);
  currentY += 2;

  const tableRows = incidents.map((inc) => {
    const config = INCIDENT_PLAYBOOKS[inc.incident_type];
    const sla = calculateSLAMetrics(inc, now);
    const steps = inc.steps || [];
    const doneSteps = steps.filter((s) => s.done).length;

    return [
      `IR-${inc.id}`,
      inc.title,
      config?.label || inc.incident_type,
      inc.severity.toUpperCase(),
      inc.status.toUpperCase(),
      `${doneSteps}/${steps.length}`,
      inc.customer_data_involved ? 'YES' : 'NO',
      inc.card_data_involved ? 'YES' : 'NO',
      formatUtcDateTime(inc.created_at),
      sla.displayText,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Ref #',
        'Incident Title',
        'Threat Vector',
        'Severity',
        'Status',
        'Playbook',
        'PII',
        'Card',
        'Logged (UTC)',
        'SLA Adherence',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [19, 27, 46], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 38 },
      3: { cellWidth: 20, fontStyle: 'bold' },
      4: { cellWidth: 22, fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 32 },
      9: { cellWidth: 27, fontStyle: 'bold' },
    },
  });

  // Save/Download PDF
  const filename = `Aweeter-SOC-Executive-Master-Summary-${now.toISOString().substring(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Downloads full incident registry as a CSV file
 */
export function downloadIncidentsCsv(incidents: Incident[], filename?: string): void {
  const headers = [
    'Incident_ID',
    'Title',
    'Type_Key',
    'Threat_Vector',
    'Severity',
    'Status',
    'Affected_Systems',
    'Customer_Data_PII',
    'Card_Data_Involved',
    'Created_At_UTC',
    'Contained_At_UTC',
    'Resolved_At_UTC',
    'Total_Playbook_Steps',
    'Completed_Playbook_Steps',
    'Action_Log_Entries_Count',
    'Description',
  ];

  const escapeCsv = (str: string | number | boolean | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = incidents.map((inc) => {
    const config = INCIDENT_PLAYBOOKS[inc.incident_type];
    const steps = inc.steps || [];
    const completedSteps = steps.filter((s) => s.done).length;
    const logCount = inc.action_log?.length || 0;

    return [
      escapeCsv(`IR-${inc.id}`),
      escapeCsv(inc.title),
      escapeCsv(inc.incident_type),
      escapeCsv(config?.label || inc.incident_type),
      escapeCsv(inc.severity),
      escapeCsv(inc.status),
      escapeCsv(inc.affected_systems),
      escapeCsv(inc.customer_data_involved ? 'YES' : 'NO'),
      escapeCsv(inc.card_data_involved ? 'YES' : 'NO'),
      escapeCsv(inc.created_at),
      escapeCsv(inc.contained_at || ''),
      escapeCsv(inc.resolved_at || ''),
      escapeCsv(steps.length),
      escapeCsv(completedSteps),
      escapeCsv(logCount),
      escapeCsv(inc.description),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename || `Aweeter-IR-Incident-Registry-${new Date().toISOString().substring(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a dedicated Regulatory Audit Report as CSV (CBN, NIBSS, NDPR)
 */
export function downloadRegulatoryAuditCsv(incidents: Incident[], simulatedNow?: Date): void {
  const now = simulatedNow || new Date();
  const headers = [
    'Incident_ID',
    'Title',
    'Severity',
    'Status',
    'Regulator',
    'Window_Hours',
    'Statutory_Deadline_UTC',
    'Hours_Remaining',
    'Breach_Status',
    'Compliance_State',
    'PII_Involved',
    'Card_Involved',
    'Created_At_UTC',
  ];

  const escapeCsv = (str: string | number | boolean | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows: string[] = [];

  incidents.forEach((inc) => {
    const regClocks = calculateRegulatoryClocks(inc, now);
    if (regClocks.length === 0) {
      rows.push(
        [
          escapeCsv(`IR-${inc.id}`),
          escapeCsv(inc.title),
          escapeCsv(inc.severity),
          escapeCsv(inc.status),
          escapeCsv('Internal Legal/Compliance Only'),
          escapeCsv('N/A'),
          escapeCsv('N/A'),
          escapeCsv('N/A'),
          escapeCsv('NO BREACH'),
          escapeCsv('COMPLIANT'),
          escapeCsv(inc.customer_data_involved ? 'YES' : 'NO'),
          escapeCsv(inc.card_data_involved ? 'YES' : 'NO'),
          escapeCsv(inc.created_at),
        ].join(',')
      );
    } else {
      regClocks.forEach((clock) => {
        rows.push(
          [
            escapeCsv(`IR-${inc.id}`),
            escapeCsv(inc.title),
            escapeCsv(inc.severity),
            escapeCsv(inc.status),
            escapeCsv(clock.regulator),
            escapeCsv(clock.hoursConfigured !== null ? `${clock.hoursConfigured}h` : 'Ad-hoc'),
            escapeCsv(clock.deadlineIso || 'N/A'),
            escapeCsv(
              clock.hoursRemaining !== null ? clock.hoursRemaining.toFixed(2) : 'N/A'
            ),
            escapeCsv(clock.isBreached ? 'BREACHED' : 'ON TRACK'),
            escapeCsv(clock.isBreached ? 'NON-COMPLIANT' : 'COMPLIANT'),
            escapeCsv(inc.customer_data_involved ? 'YES' : 'NO'),
            escapeCsv(inc.card_data_involved ? 'YES' : 'NO'),
            escapeCsv(inc.created_at),
          ].join(',')
        );
      });
    }
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Aweeter-SOC-Regulatory-Compliance-Audit-${now.toISOString().substring(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single incident JSON file
 */
export function downloadIncidentJson(incident: Incident): void {
  const jsonStr = JSON.stringify(incident, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aweeter-IR-${incident.id}-Forensic-Record.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all incidents JSON database snapshot
 */
export function downloadAllIncidentsJson(incidents: Incident[]): void {
  const exportPayload = {
    repository: 'Aweeter Bank SOC Aweeter/IR',
    exportedAtUtc: new Date().toISOString(),
    totalIncidents: incidents.length,
    incidents,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Aweeter-SOC-Full-Database-Backup-${new Date().toISOString().substring(0, 10)}.json`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a Markdown / Text Briefing document for an incident
 */
export function downloadIncidentMarkdown(incident: Incident): void {
  const config = INCIDENT_PLAYBOOKS[incident.incident_type];
  const sla = calculateSLAMetrics(incident);
  const regClocks = calculateRegulatoryClocks(incident);

  const lines = [
    `# AWEETER/IR · OFFICIAL INCIDENT BRIEFING`,
    `**Reference:** IR-${incident.id}`,
    `**Title:** ${incident.title}`,
    `**Institution:** Aweeter Bank PLC`,
    `**Classification:** STRICTLY CONFIDENTIAL // RESTRICTED BANKING SOC`,
    `**Generated:** ${formatUtcDateTime(new Date().toISOString())}`,
    ``,
    `---`,
    `## 1. Executive Overview`,
    `- **Threat Type:** ${config?.label || incident.incident_type}`,
    `- **Severity Level:** ${incident.severity.toUpperCase()}`,
    `- **Current Status:** ${incident.status.toUpperCase()}`,
    `- **Affected Systems:** ${incident.affected_systems || 'None specified'}`,
    `- **Customer PII Exposed:** ${incident.customer_data_involved ? 'YES (Confirmed)' : 'NO'}`,
    `- **Card / Payment Data Exposed:** ${incident.card_data_involved ? 'YES (Confirmed)' : 'NO'}`,
    `- **Logged Time (UTC):** ${formatUtcDateTime(incident.created_at)}`,
    `- **Contained Time (UTC):** ${formatUtcDateTime(incident.contained_at)}`,
    `- **Resolved Time (UTC):** ${formatUtcDateTime(incident.resolved_at)}`,
    `- **Containment SLA Outcome:** ${sla.displayText} (${sla.formattedTimeLeft})`,
    ``,
    `## 2. Forensic Description & Vector Analysis`,
    incident.description || 'No description recorded.',
    ``,
    `## 3. Statutory Regulatory Clocks`,
    regClocks.length === 0
      ? `*No statutory notification clocks active.*`
      : regClocks
          .map(
            (c) =>
              `- **${c.regulator}:** ${
                c.hoursConfigured !== null ? `${c.hoursConfigured}h Statutory Window` : 'Internal'
              } | Deadline: ${formatUtcDateTime(c.deadlineIso)} | Status: ${
                c.isBreached ? 'BREACHED' : 'COMPLIANT'
              }`
          )
          .join('\n'),
    ``,
    `## 4. Response Playbook Checklist Execution`,
    (incident.steps || [])
      .map(
        (s) =>
          `- [${s.done ? 'x' : ' '}] **[${s.phase.toUpperCase()}]** #${s.step_order}: ${s.step_text} ${
            s.done && s.done_at ? `*(Done: ${formatUtcDateTime(s.done_at)})*` : '*(Pending)*'
          }`
      )
      .join('\n'),
    ``,
    `## 5. Forensic Action Log & Audit Trail`,
    (incident.action_log || []).length === 0
      ? `*No action log notes recorded.*`
      : (incident.action_log || [])
          .map((l) => `- **${formatUtcDateTime(l.timestamp)}** [${l.author}]: ${l.note}`)
          .join('\n'),
    ``,
    `---`,
    `*End of Official SOC Incident Record · Aweeter Bank Aweeter/IR*`,
  ];

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aweeter-IR-${incident.id}-Executive-Briefing.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
