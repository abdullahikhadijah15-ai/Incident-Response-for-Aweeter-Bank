import React, { useState } from 'react';
import { Incident, IncidentPhase, IncidentStatus, SOCOperator } from '../types';
import { calculateRegulatoryClocks, calculateSLAMetrics, formatUtcDateTime } from '../utils/slaCalculator';
import { INCIDENT_PLAYBOOKS } from '../data/config';
import { CountdownRing } from './CountdownRing';
import { TimeWarpSimulator } from './TimeWarpSimulator';
import { ForensicIocHelper } from './ForensicIocHelper';
import { BreachFineCalculator } from './BreachFineCalculator';
import { playClick, playSuccessChime } from '../utils/audio';
import {
  generateIncidentPdf,
  downloadIncidentsCsv,
  downloadIncidentJson,
  downloadIncidentMarkdown,
} from '../utils/pdfExport';
import {
  ArrowLeft,
  Download,
  CheckSquare,
  Square,
  Clock,
  ShieldAlert,
  Send,
  Building,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
  ChevronDown,
  Radio,
  Calculator,
} from 'lucide-react';

interface IncidentDetailViewProps {
  incident: Incident;
  onBack: () => void;
  onToggleStep: (stepId: string, author?: string) => void;
  onBatchTogglePhase?: (phase: IncidentPhase, markDone: boolean, author?: string) => void;
  onUpdateStatus: (newStatus: IncidentStatus, author?: string) => void;
  onAddLogEntry: (note: string, author: string) => void;
  onOpenReportCenter?: () => void;
  onNavigateComms?: (incidentId?: number) => void;
  authenticatedOperator: SOCOperator | null;
  offsetHours: number;
  onSetOffsetHours: (hours: number) => void;
  onResetTime: () => void;
}


const PHASES: IncidentPhase[] = ['Containment', 'Eradication', 'Recovery', 'Post-Incident'];

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  onBack,
  onToggleStep,
  onBatchTogglePhase,
  onUpdateStatus,
  onAddLogEntry,
  onOpenReportCenter,
  onNavigateComms,
  authenticatedOperator,
  offsetHours,
  onSetOffsetHours,
  onResetTime,
}) => {
  const [operatorName, setOperatorName] = useState(
    authenticatedOperator?.name || 'SOC Analyst'
  );
  const [newNote, setNewNote] = useState('');
  const [activePhaseTab, setActivePhaseTab] = useState<string>('all');
  const [logFilterQuery, setLogFilterQuery] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const simulatedNow = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const config = INCIDENT_PLAYBOOKS[incident.incident_type];
  const slaMetrics = calculateSLAMetrics(incident, simulatedNow);
  const regClocks = calculateRegulatoryClocks(incident, simulatedNow);

  const steps = incident.steps || [];
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.done).length;
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Check if all Containment steps are complete
  const containmentSteps = steps.filter((s) => s.phase === 'Containment');
  const containmentAllDone =
    containmentSteps.length > 0 && containmentSteps.every((s) => s.done);
  const showPromoteToContainedBanner =
    containmentAllDone && incident.status === 'open';

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as IncidentStatus;
    onUpdateStatus(newStatus, operatorName);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddLogEntry(newNote.trim(), operatorName.trim() || 'SOC Analyst');
    setNewNote('');
  };

  const handleExportPdf = () => {
    generateIncidentPdf(incident);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incident, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Aweeter-IR-${incident.id}-Export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered action logs
  const filteredLogs = (incident.action_log || []).filter((log) => {
    if (!logFilterQuery.trim()) return true;
    const q = logFilterQuery.toLowerCase();
    return log.note.toLowerCase().includes(q) || log.author.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Time Warp Simulator Bar */}
      <TimeWarpSimulator
        offsetHours={offsetHours}
        onSetOffsetHours={onSetOffsetHours}
        onResetTime={onResetTime}
      />

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="detail-back-btn"
          onClick={() => {
            playClick();
            onBack();
          }}
          className="text-xs font-mono text-[#9AA5B8] hover:text-[#E8EAED] flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131B2E] border border-[#223055] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dispatch Communications War Room Button */}
          {onNavigateComms && (
            <button
              type="button"
              id="detail-dispatch-comms-btn"
              onClick={() => {
                playClick();
                onNavigateComms(incident.id);
              }}
              className="px-3 py-1.5 bg-[#1B2540] hover:bg-[#223055] border border-[#F2A93B]/60 text-[#F2A93B] text-xs font-mono rounded flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open Communications Center with pre-filled statutory drafts for this incident"
            >
              <Radio className="w-3.5 h-3.5 text-[#F2A93B] animate-pulse" />
              <span>Dispatch Comms / CBN Notice</span>
            </button>
          )}

          {/* Operator identification chip */}
          <div className="flex items-center gap-2 text-xs font-mono bg-[#131B2E] border border-[#223055] px-2.5 py-1 rounded">
            <span className="text-[#9AA5B8]">Active Operator:</span>
            <input
              id="active-operator-input"
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Analyst Name"
              className="bg-[#0B1220] border border-[#223055] px-2 py-0.5 rounded text-[#E8EAED] text-xs font-mono w-32 focus:outline-none focus:border-[#F2A93B]"
            />
          </div>

          {/* Download CSV Button */}
          <button
            type="button"
            id="export-csv-btn"
            onClick={() => {
              playClick();
              downloadIncidentsCsv([incident], `Aweeter-IR-${incident.id}-Report.csv`);
            }}
            className="px-3 py-1.5 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] hover:border-[#2DD4BF]/50 text-[#2DD4BF] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
            title="Download incident data as spreadsheet CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>


          {/* More Formats Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="export-more-formats-btn"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-2.5 py-1.5 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] text-[#9AA5B8] hover:text-[#E8EAED] text-xs font-mono rounded flex items-center gap-1 transition-colors"
              title="More export formats (JSON, Markdown, SOC Report Center)"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-[#131B2E] border border-[#223055] rounded shadow-xl py-1 z-30 font-mono text-xs animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    downloadIncidentJson(incident);
                    setShowExportDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#E8EAED] hover:bg-[#1B2540] hover:text-[#F2A93B] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#9AA5B8]" />
                  <span>Forensic Data (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadIncidentMarkdown(incident);
                    setShowExportDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#E8EAED] hover:bg-[#1B2540] hover:text-[#F2A93B] flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-[#9AA5B8]" />
                  <span>Executive Briefing (.MD)</span>
                </button>

                {onOpenReportCenter && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReportCenter();
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#2DD4BF] hover:bg-[#1B2540] border-t border-[#1B2540] flex items-center gap-2 font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Open Report Center...</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Export Official PDF Button */}
          <button
            id="export-pdf-btn"
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 bg-[#F2A93B] hover:bg-[#e09b32] text-[#0B1220] text-xs font-bold font-sans uppercase rounded flex items-center gap-1.5 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official PDF</span>
          </button>
        </div>
      </div>

      {/* Containment Phase Completion Banner Suggestion */}
      {showPromoteToContainedBanner && (
        <div className="p-4 rounded bg-teal-950/80 border border-teal-500/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-teal-200 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <span className="font-bold text-teal-100 block">
                ALL CONTAINMENT PLAYBOOK STEPS VERIFIED (100% COMPLETE)
              </span>
              <span>
                Immediate threat vector isolated. Promote incident lifecycle state to CONTAINED?
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateStatus('contained', operatorName)}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-[#0B1220] font-bold rounded uppercase tracking-wider text-xs whitespace-nowrap transition-colors"
          >
            ✓ Mark as Contained
          </button>
        </div>
      )}

      {/* Incident Header Card */}
      <div className="bg-[#131B2E] border border-[#223055] p-5 rounded">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-[#F2A93B] tracking-wider px-2 py-0.5 rounded bg-[#0B1220] border border-[#223055]">
                IR-{incident.id}
              </span>

              <span
                className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded font-bold badge-${incident.severity}`}
              >
                {incident.severity} SEVERITY
              </span>

              <span
                className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded font-bold badge-${incident.status}`}
              >
                {incident.status}
              </span>

              <span className="text-xs font-mono text-[#9AA5B8] bg-[#1B2540] px-2 py-0.5 rounded">
                {config?.label || incident.incident_type}
              </span>

              {incident.customer_data_involved && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  PII EXPOSED
                </span>
              )}
              {incident.card_data_involved && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  CARD DATA AT RISK
                </span>
              )}
            </div>

            {/* Incident Title */}
            <h1 className="text-xl font-bold text-[#E8EAED]">{incident.title}</h1>

            {/* Key Timestamps Bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9AA5B8] font-mono pt-1">
              <span>Created: {formatUtcDateTime(incident.created_at)}</span>
              {incident.contained_at && (
                <span className="text-[#2DD4BF]">
                  • Contained: {formatUtcDateTime(incident.contained_at)}
                </span>
              )}
              {incident.resolved_at && (
                <span className="text-[#9AA5B8]">
                  • Closed: {formatUtcDateTime(incident.resolved_at)}
                </span>
              )}
            </div>
          </div>

          {/* Status Quick Toggle Dropdown */}
          <div className="bg-[#0B1220] border border-[#223055] p-3 rounded flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div>
              <span className="block text-[10px] font-mono uppercase text-[#9AA5B8]">Lifecycle Status</span>
              <span className="text-xs text-[#E8EAED] font-mono font-semibold">Immediate Transition:</span>
            </div>
            <select
              id="incident-status-select"
              value={incident.status}
              onChange={handleStatusChange}
              className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase cursor-pointer border focus:outline-none ${
                incident.status === 'contained'
                  ? 'bg-teal-950/80 border-teal-600 text-teal-300'
                  : incident.status === 'open'
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <option value="open">STATUS: OPEN</option>
              <option value="contained">STATUS: CONTAINED</option>
              <option value="closed">STATUS: CLOSED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Affected Systems & Description Panel */}
          <div className="bg-[#131B2E] border border-[#223055] p-5 rounded space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#9AA5B8] block mb-1">
                Affected Systems & Infrastructure
              </span>
              <div className="px-3 py-2 rounded bg-[#0B1220] border border-[#223055] text-xs font-mono text-[#E8EAED]">
                {incident.affected_systems || 'No specific systems specified.'}
              </div>
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#9AA5B8] block mb-1">
                Forensic Context & Impact Description
              </span>
              <div className="px-3.5 py-2.5 rounded bg-[#0B1220] border border-[#223055] text-sm text-[#E8EAED] leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </div>
            </div>
          </div>

          {/* Phased Playbook Checklist */}
          <div className="bg-[#131B2E] border border-[#223055] rounded">
            {/* Header & Overall Progress */}
            <div className="p-4 border-b border-[#223055] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#E8EAED] font-mono flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#2DD4BF]" />
                  <span>Response Playbook Execution</span>
                </h2>
                <p className="text-xs text-[#9AA5B8] mt-0.5">
                  Phase-by-phase containment, eradication, recovery, and post-incident tasks.
                </p>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#9AA5B8]">Progress:</span>
                <div className="w-24 bg-[#0B1220] border border-[#223055] h-2.5 rounded overflow-hidden">
                  <div
                    className="bg-[#2DD4BF] h-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <span className="font-bold text-[#2DD4BF]">
                  {completedSteps}/{totalSteps} ({overallProgress}%)
                </span>
              </div>
            </div>

            {/* Phase Filters */}
            <div className="px-4 py-2 bg-[#1B2540] border-b border-[#223055] flex flex-wrap gap-1">
              <button
                onClick={() => setActivePhaseTab('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activePhaseTab === 'all'
                    ? 'bg-[#F2A93B] text-[#0B1220] font-bold'
                    : 'text-[#9AA5B8] hover:text-[#E8EAED]'
                }`}
              >
                All Phases ({totalSteps})
              </button>
              {PHASES.map((phase) => {
                const phaseSteps = steps.filter((s) => s.phase === phase);
                if (phaseSteps.length === 0) return null;
                const phaseDone = phaseSteps.filter((s) => s.done).length;
                return (
                  <button
                    key={phase}
                    onClick={() => setActivePhaseTab(phase)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                      activePhaseTab === phase
                        ? 'bg-[#F2A93B] text-[#0B1220] font-bold'
                        : 'text-[#9AA5B8] hover:text-[#E8EAED]'
                    }`}
                  >
                    <span>{phase}</span>
                    <span className="text-[10px] opacity-75">
                      ({phaseDone}/{phaseSteps.length})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Checklist Items Grouped by Phase */}
            <div className="divide-y divide-[#1B2540] p-2 sm:p-4 space-y-4">
              {PHASES.map((phase) => {
                const phaseSteps = steps.filter((s) => s.phase === phase);
                if (phaseSteps.length === 0) return null;
                if (activePhaseTab !== 'all' && activePhaseTab !== phase) return null;

                const phaseDone = phaseSteps.filter((s) => s.done).length;
                const isAllDone = phaseDone === phaseSteps.length && phaseSteps.length > 0;

                return (
                  <div key={phase} className="space-y-2 pt-2 first:pt-0">
                    {/* Phase Header */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAllDone ? 'bg-[#2DD4BF]' : phaseDone > 0 ? 'bg-[#F2A93B]' : 'bg-[#6B7A99]'
                          }`}
                        ></span>
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#E8EAED]">
                          Phase: {phase}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[#9AA5B8]">
                        {phaseDone}/{phaseSteps.length} Completed
                      </span>
                    </div>

                    {/* Steps list */}
                    <div className="space-y-1.5">
                      {phaseSteps.map((step) => {
                        return (
                          <div
                            key={step.id}
                            id={`step-item-${step.id}`}
                            onClick={() => onToggleStep(step.id, operatorName)}
                            className={`p-3 rounded border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              step.done
                                ? 'bg-[#0B1220]/60 border-[#223055] opacity-80'
                                : 'bg-[#1B2540] border-[#223055] hover:border-[#F2A93B]/60'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                className="pt-0.5 text-left focus:outline-none"
                                title={step.done ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {step.done ? (
                                  <CheckSquare className="w-4 h-4 text-[#2DD4BF]" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#9AA5B8] hover:text-[#F2A93B]" />
                                )}
                              </button>

                              <div>
                                <p
                                  className={`text-xs ${
                                    step.done
                                      ? 'text-[#9AA5B8] line-through'
                                      : 'text-[#E8EAED] font-medium'
                                  }`}
                                >
                                  {step.step_text}
                                </p>
                                {step.done && step.done_at && (
                                  <span className="text-[10px] font-mono text-[#2DD4BF] mt-1 block">
                                    ✓ Completed {formatUtcDateTime(step.done_at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-[#6B7A99] shrink-0">
                              #{step.step_order}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Forensic IOC & Telemetry Helper */}
          <ForensicIocHelper
            incident={incident}
            onAddNote={(note) => {
              onAddLogEntry(note, operatorName);
              playSuccessChime();
            }}
          />

          {/* Interactive Statutory Breach Exposure & Fine Calculator */}
          <BreachFineCalculator
            initialCustomerData={incident.customer_data_involved}
            initialCardData={incident.card_data_involved}
          />

          {/* Action Log Timeline */}
          <div className="bg-[#131B2E] border border-[#223055] rounded">
            <div className="p-4 border-b border-[#223055] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#E8EAED] font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F2A93B]" />
                <span>Forensic Action Log & Notes ({incident.action_log?.length || 0})</span>
              </h2>

              {/* Log filter search */}
              <input
                type="text"
                value={logFilterQuery}
                onChange={(e) => setLogFilterQuery(e.target.value)}
                placeholder="Filter logs by keyword / author..."
                className="px-2.5 py-1 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] font-mono placeholder-[#6B7A99] w-full sm:w-56 focus:outline-none focus:border-[#F2A93B]"
              />
            </div>

            {/* Log Entries List */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-3">
              {filteredLogs.length === 0 ? (
                <p className="text-xs text-[#9AA5B8] font-mono text-center py-4">
                  {logFilterQuery ? 'No log entries match your search.' : 'No action log entries recorded yet.'}
                </p>
              ) : (
                filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded bg-[#0B1220] border border-[#223055] text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-[#9AA5B8] text-[11px]">
                      <span className="text-[#F2A93B] font-bold">{entry.author}</span>
                      <span>{formatUtcDateTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-[#E8EAED] whitespace-pre-wrap font-sans leading-relaxed">
                      {entry.note}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Log Form */}
            <form onSubmit={handleAddLog} className="p-4 border-t border-[#223055] bg-[#1B2540] flex gap-2">
              <input
                id="add-log-note-input"
                type="text"
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={`Append note as "${operatorName}"...`}
                className="flex-1 px-3 py-1.5 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] placeholder-[#6B7A99] focus:outline-none focus:border-[#F2A93B]"
              />
              <button
                type="submit"
                id="add-log-submit-btn"
                className="px-3.5 py-1.5 bg-[#F2A93B] hover:bg-[#e09b32] text-[#0B1220] text-xs font-bold rounded flex items-center gap-1 transition-colors font-sans uppercase"
              >
                <Send className="w-3 h-3" />
                <span>Post Note</span>
              </button>
            </form>
          </div>
        </div>

        {/* Side Column (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* SLA Ring Panel */}
          <div className="bg-[#131B2E] border border-[#223055] p-5 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-[#223055] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#E8EAED] font-bold">
                Containment SLA Clock
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1B2540] text-[#F2A93B]">
                {slaMetrics.slaHours}h Target
              </span>
            </div>

            {/* Large signature donut ring */}
            <div className="py-3 flex flex-col items-center justify-center">
              <CountdownRing metrics={slaMetrics} size="lg" />
              <div className="mt-4 text-center">
                <span
                  className="font-mono text-base font-bold block"
                  style={{ color: slaMetrics.color }}
                >
                  {slaMetrics.formattedTimeLeft}
                </span>
                <span className="text-[11px] text-[#9AA5B8] font-mono mt-0.5 block">
                  {slaMetrics.status === 'met'
                    ? 'SLA Objective Met'
                    : slaMetrics.status === 'breached'
                    ? 'SLA Target Exceeded'
                    : 'Time Remaining for Containment'}
                </span>
              </div>
            </div>

            {/* SLA Specs */}
            <div className="bg-[#0B1220] border border-[#223055] p-3 rounded space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#9AA5B8]">Severity Tier:</span>
                <span className="text-[#E8EAED] uppercase font-bold">{incident.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA5B8]">Target SLA:</span>
                <span className="text-[#E8EAED]">{slaMetrics.slaHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9AA5B8]">Target Deadline:</span>
                <span className="text-[#E8EAED]">{formatUtcDateTime(slaMetrics.slaDeadlineIso)}</span>
              </div>
              <div className="flex justify-between border-t border-[#1B2540] pt-2">
                <span className="text-[#9AA5B8]">Status:</span>
                <span
                  className="font-bold"
                  style={{ color: slaMetrics.color }}
                >
                  {slaMetrics.displayText}
                </span>
              </div>
            </div>
          </div>

          {/* Regulatory Notification Panel */}
          <div className="bg-[#131B2E] border border-[#223055] p-5 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-[#223055] pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#2DD4BF]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#E8EAED] font-bold">
                  Regulatory Notification Panel
                </span>
              </div>
            </div>

            {regClocks.length === 0 ? (
              <p className="text-xs text-[#9AA5B8] font-mono">No mandatory external regulators mapped.</p>
            ) : (
              <div className="space-y-3">
                {regClocks.map((clock) => {
                  if (clock.hoursConfigured === null) {
                    return (
                      <div
                        key={clock.regulator}
                        className="p-3 rounded bg-[#0B1220] border border-[#223055] text-xs font-mono space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#E8EAED]">{clock.regulator}</span>
                          <span className="text-[#9AA5B8] text-[11px]">Internal Coordination</span>
                        </div>
                        <p className="text-[11px] text-[#6B7A99]">
                          Handled internally with Legal & Compliance counsel per incident policy.
                        </p>
                      </div>
                    );
                  }

                  const isBreached = clock.isBreached;

                  return (
                    <div
                      key={clock.regulator}
                      className={`p-3 rounded border text-xs font-mono space-y-1.5 ${
                        isBreached
                          ? 'bg-red-950/40 border-red-800/80 text-red-200'
                          : (clock.hoursRemaining || 0) < 12
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                          : 'bg-[#0B1220] border-[#223055] text-[#E8EAED]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#E8EAED]">{clock.regulator}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBreached
                              ? 'bg-red-900/80 text-red-200 border border-red-700'
                              : 'bg-[#1B2540] text-[#2DD4BF] border border-[#223055]'
                          }`}
                        >
                          {clock.hoursConfigured}h Window
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#9AA5B8]">Statutory Deadline:</span>
                        <span>{formatUtcDateTime(clock.deadlineIso)}</span>
                      </div>

                      <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-[#1B2540]">
                        <span>Time Remaining:</span>
                        <span
                          className={
                            isBreached
                              ? 'text-red-400 font-bold'
                              : (clock.hoursRemaining || 0) < 12
                              ? 'text-amber-400'
                              : 'text-[#2DD4BF]'
                          }
                        >
                          {isBreached
                            ? `BREACHED (-${Math.abs(clock.hoursRemaining || 0).toFixed(1)}h)`
                            : `${(clock.hoursRemaining || 0).toFixed(1)} Hours`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mandatory Regulatory Disclaimer */}
            <p className="text-[11px] text-[#6B7A99] font-mono italic leading-normal border-t border-[#223055] pt-3">
              * Regulatory notification deadline hours are configurable placeholders to be confirmed against current CBN and NDPR/NITDA directives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
