import { Incident, IncidentStatus, Severity, Step, ActionLogEntry, IncidentTypeKey } from '../types';
import { INITIAL_INCIDENTS, seedPlaybookSteps } from '../data/initialData';
import { INCIDENT_PLAYBOOKS } from '../data/config';

const STORAGE_KEY = 'aweeter_sentinel_incidents_v1';

export function loadIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    return parsed;
  } catch {
    return INITIAL_INCIDENTS;
  }
}

export function saveIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.error('Failed to persist incidents to local storage', err);
  }
}

export function getIncidentById(id: number): Incident | undefined {
  const incidents = loadIncidents();
  return incidents.find((inc) => inc.id === id);
}

export interface CreateIncidentInput {
  title: string;
  incident_type: IncidentTypeKey;
  severity?: Severity;
  affected_systems: string;
  description: string;
  customer_data_involved: boolean;
  card_data_involved: boolean;
  author?: string;
}

export function createIncident(input: CreateIncidentInput): Incident {
  const incidents = loadIncidents();
  const config = INCIDENT_PLAYBOOKS[input.incident_type];
  const severity = input.severity || config?.defaultSeverity || 'high';

  // Determine next autoincrement ID
  const maxId = incidents.reduce((max, inc) => (inc.id > max ? inc.id : max), 1000);
  const newId = maxId + 1;
  const nowIso = new Date().toISOString();

  const newSteps: Step[] = seedPlaybookSteps(newId, input.incident_type);

  const initialLog: ActionLogEntry = {
    id: `log-${newId}-1`,
    incident_id: newId,
    timestamp: nowIso,
    author: input.author?.trim() || 'SOC Analyst',
    note: `Incident ${newId} initialized. Severity: ${severity.toUpperCase()}. Playbook loaded (${newSteps.length} steps).`,
  };

  const newIncident: Incident = {
    id: newId,
    title: input.title.trim(),
    incident_type: input.incident_type,
    severity,
    status: 'open',
    affected_systems: input.affected_systems.trim() || 'Unspecified',
    description: input.description.trim(),
    customer_data_involved: input.customer_data_involved,
    card_data_involved: input.card_data_involved,
    created_at: nowIso,
    contained_at: null,
    resolved_at: null,
    steps: newSteps,
    action_log: [initialLog],
  };

  const updated = [newIncident, ...incidents];
  saveIncidents(updated);
  return newIncident;
}

export function toggleIncidentStep(incidentId: number, stepId: string, author: string = 'SOC Analyst'): Incident | undefined {
  const incidents = loadIncidents();
  const incidentIndex = incidents.findIndex((inc) => inc.id === incidentId);
  if (incidentIndex === -1) return undefined;

  const incident = { ...incidents[incidentIndex] };
  const steps = incident.steps ? [...incident.steps] : [];
  const stepIndex = steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) return undefined;

  const step = { ...steps[stepIndex] };
  const newDone = !step.done;
  const nowIso = new Date().toISOString();

  step.done = newDone;
  step.done_at = newDone ? nowIso : null;
  steps[stepIndex] = step;
  incident.steps = steps;

  // Append action log entry
  const logEntry: ActionLogEntry = {
    id: `log-${incidentId}-${Date.now()}`,
    incident_id: incidentId,
    timestamp: nowIso,
    author: author.trim() || 'SOC Analyst',
    note: `${newDone ? 'Completed' : 'Reopened'} [${step.phase}] step: "${step.step_text}"`,
  };

  incident.action_log = [...(incident.action_log || []), logEntry];
  incidents[incidentIndex] = incident;
  saveIncidents(incidents);
  return incident;
}

export function updateIncidentStatus(incidentId: number, newStatus: IncidentStatus, author: string = 'SOC Analyst'): Incident | undefined {
  const incidents = loadIncidents();
  const incidentIndex = incidents.findIndex((inc) => inc.id === incidentId);
  if (incidentIndex === -1) return undefined;

  const incident = { ...incidents[incidentIndex] };
  const oldStatus = incident.status;
  if (oldStatus === newStatus) return incident;

  const nowIso = new Date().toISOString();
  incident.status = newStatus;

  if (newStatus === 'contained' && !incident.contained_at) {
    incident.contained_at = nowIso;
  } else if (newStatus === 'closed') {
    if (!incident.contained_at) incident.contained_at = nowIso;
    incident.resolved_at = nowIso;
  } else if (newStatus === 'open') {
    // If reopened
    incident.contained_at = null;
    incident.resolved_at = null;
  }

  const logEntry: ActionLogEntry = {
    id: `log-${incidentId}-${Date.now()}`,
    incident_id: incidentId,
    timestamp: nowIso,
    author: author.trim() || 'SOC Analyst',
    note: `Status updated from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}.${
      newStatus === 'contained' ? ' Containment timestamp recorded.' : ''
    }`,
  };

  incident.action_log = [...(incident.action_log || []), logEntry];
  incidents[incidentIndex] = incident;
  saveIncidents(incidents);
  return incident;
}

export function addIncidentLogEntry(incidentId: number, note: string, author: string): Incident | undefined {
  const incidents = loadIncidents();
  const incidentIndex = incidents.findIndex((inc) => inc.id === incidentId);
  if (incidentIndex === -1) return undefined;

  const incident = { ...incidents[incidentIndex] };
  const nowIso = new Date().toISOString();

  const newLog: ActionLogEntry = {
    id: `log-${incidentId}-${Date.now()}`,
    incident_id: incidentId,
    timestamp: nowIso,
    author: author.trim() || 'SOC Analyst',
    note: note.trim(),
  };

  incident.action_log = [...(incident.action_log || []), newLog];
  incidents[incidentIndex] = incident;
  saveIncidents(incidents);
  return incident;
}

export function resetDemoData(): Incident[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
  return INITIAL_INCIDENTS;
}
