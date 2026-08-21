import { Incident, RegulatoryClock, SLAMetrics } from '../types';
import { REGULATOR_DEADLINE_HOURS, SEVERITY_SLA_HOURS, INCIDENT_PLAYBOOKS } from '../data/config';

export function calculateSLAMetrics(incident: Incident, now: Date = new Date()): SLAMetrics {
  const createdTime = new Date(incident.created_at).getTime();
  const slaHours = SEVERITY_SLA_HOURS[incident.severity] || 24;
  const slaMs = slaHours * 60 * 60 * 1000;
  const deadlineTime = createdTime + slaMs;
  const deadlineIso = new Date(deadlineTime).toISOString();

  // If incident is already contained or closed
  if (incident.status === 'contained' || incident.status === 'closed') {
    const containedTime = incident.contained_at
      ? new Date(incident.contained_at).getTime()
      : incident.resolved_at
      ? new Date(incident.resolved_at).getTime()
      : deadlineTime - 1000; // fallback

    const durationHours = Math.max(0, (containedTime - createdTime) / (1000 * 60 * 60));
    const isMet = containedTime <= deadlineTime;

    return {
      slaHours,
      slaDeadlineIso: deadlineIso,
      hoursRemaining: isMet ? (deadlineTime - containedTime) / (1000 * 60 * 60) : 0,
      percentRemaining: isMet ? 100 : 0,
      status: isMet ? 'met' : 'breached',
      color: isMet ? '#2DD4BF' : '#E5484D',
      displayText: isMet ? `Met in ${durationHours.toFixed(1)}h` : `Breached by ${(durationHours - slaHours).toFixed(1)}h`,
      formattedTimeLeft: isMet ? 'CONTAINED' : 'RESOLVED (BREACHED)',
    };
  }

  // Open incident calculation
  const currentTime = now.getTime();
  const msRemaining = deadlineTime - currentTime;
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  const percentRemaining = Math.max(0, Math.min(100, (msRemaining / slaMs) * 100));

  let color = '#2DD4BF'; // Teal
  let status: 'active' | 'breached' = 'active';

  if (hoursRemaining <= 0) {
    color = '#E5484D'; // Red
    status = 'breached';
  } else if (percentRemaining < 15) {
    color = '#E5484D'; // Red
  } else if (percentRemaining <= 50) {
    color = '#F2A93B'; // Amber
  } else {
    color = '#2DD4BF'; // Teal
  }

  let formattedTimeLeft: string;
  if (hoursRemaining <= 0) {
    const overdueHours = Math.abs(hoursRemaining);
    formattedTimeLeft = `-${overdueHours.toFixed(1)}h OVERDUE`;
  } else if (hoursRemaining < 1) {
    const minutesLeft = Math.round(hoursRemaining * 60);
    formattedTimeLeft = `${minutesLeft}m left`;
  } else {
    formattedTimeLeft = `${hoursRemaining.toFixed(1)}h left`;
  }

  return {
    slaHours,
    slaDeadlineIso: deadlineIso,
    hoursRemaining,
    percentRemaining,
    status,
    color,
    displayText: `${percentRemaining.toFixed(0)}%`,
    formattedTimeLeft,
  };
}

export function calculateRegulatoryClocks(incident: Incident, now: Date = new Date()): RegulatoryClock[] {
  const config = INCIDENT_PLAYBOOKS[incident.incident_type];
  if (!config) return [];

  const createdTime = new Date(incident.created_at).getTime();
  const currentTime = now.getTime();

  return config.regulators.map((regulator) => {
    const hours = REGULATOR_DEADLINE_HOURS[regulator];
    if (hours === null || hours === undefined) {
      return {
        regulator,
        hoursConfigured: null,
        deadlineIso: null,
        hoursRemaining: null,
        isBreached: false,
      };
    }

    const deadlineTime = createdTime + hours * 60 * 60 * 1000;
    const msRemaining = deadlineTime - currentTime;
    const hoursRemaining = msRemaining / (1000 * 60 * 60);
    const isBreached = hoursRemaining < 0;

    return {
      regulator,
      hoursConfigured: hours,
      deadlineIso: new Date(deadlineTime).toISOString(),
      hoursRemaining,
      isBreached,
    };
  });
}

export function formatUtcDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return '—';
  }
}
