import React, { useState } from 'react';
import { Incident, CommsMessage } from '../types';
import { calculateRegulatoryClocks, calculateSLAMetrics, formatUtcDateTime } from '../utils/slaCalculator';
import { INCIDENT_PLAYBOOKS } from '../data/config';
import { generateIncidentPdf, downloadIncidentsCsv } from '../utils/pdfExport';
import { CountdownRing } from './CountdownRing';
import { TimeWarpSimulator } from './TimeWarpSimulator';
import { BreachFineCalculator } from './BreachFineCalculator';
import { playClick } from '../utils/audio';
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Flame,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  Radio,
  Calculator,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  incidents: Incident[];
  onSelectIncident: (id: number) => void;
  onNavigateNew: () => void;
  onNavigateComms?: () => void;
  onOpenReportCenter?: () => void;
  offsetHours: number;
  onSetOffsetHours: (hours: number) => void;
  onResetTime: () => void;
  recentComms?: CommsMessage[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  incidents,
  onSelectIncident,
  onNavigateNew,
  onNavigateComms,
  onOpenReportCenter,
  offsetHours,
  onSetOffsetHours,
  onResetTime,
  recentComms = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Simulated current time with offset
  const simulatedNow = new Date(Date.now() + offsetHours * 60 * 60 * 1000);

  // Stats calculation
  const openIncidents = incidents.filter((i) => i.status === 'open');
  const criticalOpenCount = openIncidents.filter((i) => i.severity === 'critical').length;
  const highOpenCount = openIncidents.filter((i) => i.severity === 'high').length;
  const mediumOpenCount = openIncidents.filter((i) => i.severity === 'medium').length;
  const lowOpenCount = openIncidents.filter((i) => i.severity === 'low').length;

  const slaBreachedCount = openIncidents.filter((i) => {
    const metrics = calculateSLAMetrics(i, simulatedNow);
    return metrics.status === 'breached';
  }).length;

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchId = `ir-${inc.id}`.includes(q) || inc.id.toString().includes(q);
      const matchSystems = inc.affected_systems.toLowerCase().includes(q);
      const matchType = (INCIDENT_PLAYBOOKS[inc.incident_type]?.label || inc.incident_type).toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchSystems && !matchType) return false;
    }
    return true;
  });

  const latestDispatch = recentComms[0];

  return (
    <div className="space-y-6">
      {/* Time Warp Simulator Bar */}
      <TimeWarpSimulator
        offsetHours={offsetHours}
        onSetOffsetHours={onSetOffsetHours}
        onResetTime={onResetTime}
      />

      {/* Top Directive & Comms Ticker Banner */}
      <div className="bg-[#131B2E] border border-[#223055] px-4 py-2.5 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-[#9AA5B8]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F2A93B]"></span>
          <span className="font-mono text-[#E8EAED] font-semibold">SOC OPERATIONAL DIRECTIVE:</span>
          <span>Mandatory real-time containment execution & statutory compliance tracking active.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClick();
              setShowCalculator(!showCalculator);
            }}
            className="text-[11px] font-mono text-[#F2A93B] hover:underline flex items-center gap-1"
          >
            <Calculator className="w-3 h-3" />
            <span>{showCalculator ? 'Hide Fine Calculator' : 'Breach Fine Calculator'}</span>
          </button>
          <span className="font-mono text-[11px] text-[#6B7A99] italic hidden lg:inline">
            Aweeter/IR · RFC-IR-04 Baseline
          </span>
        </div>
      </div>

      {/* Interactive Breach Exposure & Fine Calculator Section */}
      {showCalculator && (
        <div className="animate-fadeIn">
          <BreachFineCalculator />
        </div>
      )}

      {/* Recent Comms Dispatch Banner (Interactive Quick-Jump) */}
      {latestDispatch && onNavigateComms && (
        <div
          onClick={() => {
            playClick();
            onNavigateComms();
          }}
          className="bg-[#181216] border border-amber-900/60 p-3 rounded flex items-center justify-between gap-3 cursor-pointer hover:border-amber-700 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-950 text-[#F2A93B] border border-amber-800 shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="text-xs font-mono">
              <span className="text-[#F2A93B] font-bold">LATEST WAR-ROOM TRANSMISSION: </span>
              <span className="text-[#E8EAED] line-clamp-1 font-sans inline-block align-bottom max-w-2xl">
                {latestDispatch.content}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#2DD4BF] group-hover:translate-x-1 transition-transform shrink-0">
            <span>Open Communications Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Open Incidents */}
        <div
          id="stat-open-incidents"
          className="bg-[#131B2E] border border-[#223055] p-4 rounded flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#9AA5B8] tracking-wider">Active Open IRs</span>
            <Flame className="w-4 h-4 text-[#F2A93B]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#E8EAED]">{openIncidents.length}</span>
            <span className="text-xs text-[#9AA5B8] font-mono">of {incidents.length} total</span>
          </div>
          <div className="mt-2 text-[11px] text-[#9AA5B8] border-t border-[#1B2540] pt-2 flex justify-between font-mono">
            <span>Critical/High: {criticalOpenCount + highOpenCount}</span>
            <span>Med/Low: {mediumOpenCount + lowOpenCount}</span>
          </div>
        </div>

        {/* Critical Open Count */}
        <div
          id="stat-critical-open"
          className="bg-[#131B2E] border border-[#223055] p-4 rounded flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#E5484D] tracking-wider">Critical Open</span>
            <AlertTriangle className="w-4 h-4 text-[#E5484D]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#E5484D]">{criticalOpenCount}</span>
            <span className="text-xs text-[#9AA5B8] font-mono">4h Max SLA</span>
          </div>
          <div className="mt-2 text-[11px] text-[#9AA5B8] border-t border-[#1B2540] pt-2 font-mono">
            Requires immediate executive containment
          </div>
        </div>

        {/* SLA Breached / At Risk */}
        <div
          id="stat-sla-breached"
          className="bg-[#131B2E] border border-[#223055] p-4 rounded flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#F2A93B] tracking-wider">SLA Breached</span>
            <Clock className="w-4 h-4 text-[#F2A93B]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-bold font-mono ${slaBreachedCount > 0 ? 'text-[#E5484D]' : 'text-[#2DD4BF]'}`}>
              {slaBreachedCount}
            </span>
            <span className="text-xs text-[#9AA5B8] font-mono">Containment Target</span>
          </div>
          <div className="mt-2 text-[11px] text-[#9AA5B8] border-t border-[#1B2540] pt-2 font-mono">
            {slaBreachedCount === 0 ? '✓ Zero SLA breaches active' : '⚠ Escalation triggered to CISO'}
          </div>
        </div>

        {/* Open by Severity Breakdown */}
        <div
          id="stat-severity-breakdown"
          className="bg-[#131B2E] border border-[#223055] p-4 rounded flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-[#9AA5B8] tracking-wider">Severity Matrix</span>
            <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-xs">
            <div className="px-2 py-1 rounded bg-[#1B2540] flex justify-between items-center">
              <span className="text-[#E5484D] font-semibold text-[11px]">CRIT</span>
              <span className="text-[#E8EAED] font-bold">{criticalOpenCount}</span>
            </div>
            <div className="px-2 py-1 rounded bg-[#1B2540] flex justify-between items-center">
              <span className="text-[#F2A93B] font-semibold text-[11px]">HIGH</span>
              <span className="text-[#E8EAED] font-bold">{highOpenCount}</span>
            </div>
            <div className="px-2 py-1 rounded bg-[#1B2540] flex justify-between items-center">
              <span className="text-[#E8C547] font-semibold text-[11px]">MED</span>
              <span className="text-[#E8EAED] font-bold">{mediumOpenCount}</span>
            </div>
            <div className="px-2 py-1 rounded bg-[#1B2540] flex justify-between items-center">
              <span className="text-[#6B7A99] font-semibold text-[11px]">LOW</span>
              <span className="text-[#E8EAED] font-bold">{lowOpenCount}</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#9AA5B8] border-t border-[#1B2540] pt-1 font-mono">
            Active open backlog
          </div>
        </div>
      </div>

      {/* Incident Queue Section */}
      <div className="bg-[#131B2E] border border-[#223055] rounded">
        {/* Controls Header */}
        <div className="p-4 border-b border-[#223055] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#E8EAED] uppercase tracking-wider">
              Incident Response Queue
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1B2540] text-[#9AA5B8] border border-[#223055]">
              {filteredIncidents.length} Records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5B8]" />
              <input
                id="incident-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search IR#, title, system..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] placeholder-[#9AA5B8] focus:outline-none focus:border-[#F2A93B] font-mono"
              />
            </div>

            {/* Status Filter */}
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => {
                playClick();
                setStatusFilter(e.target.value);
              }}
              className="px-2.5 py-1.5 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] focus:outline-none focus:border-[#F2A93B] font-mono"
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="contained">Contained</option>
              <option value="closed">Closed</option>
            </select>

            {/* Severity Filter */}
            <select
              id="severity-filter-select"
              value={severityFilter}
              onChange={(e) => {
                playClick();
                setSeverityFilter(e.target.value);
              }}
              className="px-2.5 py-1.5 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] focus:outline-none focus:border-[#F2A93B] font-mono"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Download Reports Button */}
            {onOpenReportCenter && (
              <button
                type="button"
                id="queue-download-reports-btn"
                onClick={() => {
                  playClick();
                  onOpenReportCenter();
                }}
                title="Open Report & Export Center"
                className="px-3 py-1.5 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] hover:border-[#2DD4BF]/60 text-[#2DD4BF] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Reports & Exports</span>
              </button>
            )}

            {/* "+ Log Incident" CTA */}
            <button
              id="dashboard-new-incident-btn"
              onClick={() => {
                playClick();
                onNavigateNew();
              }}
              className="px-3.5 py-1.5 bg-[#F2A93B] hover:bg-[#e09b32] text-[#0B1220] text-xs font-semibold rounded font-sans tracking-wide transition-colors whitespace-nowrap"
            >
              + Log Incident
            </button>
          </div>
        </div>

        {/* Incidents Table / Queue List */}
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-[#9AA5B8] font-mono">
            <p className="text-sm">No incidents match the active search and filter criteria.</p>
            <button
              onClick={() => {
                playClick();
                setSearchTerm('');
                setStatusFilter('all');
                setSeverityFilter('all');
              }}
              className="mt-3 text-xs text-[#F2A93B] hover:underline font-mono"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#223055]">
            {filteredIncidents.map((incident) => {
              const sla = calculateSLAMetrics(incident, simulatedNow);
              const regClocks = calculateRegulatoryClocks(incident, simulatedNow);
              const playbook = INCIDENT_PLAYBOOKS[incident.incident_type];
              const totalSteps = incident.steps?.length || 0;
              const completedSteps = incident.steps?.filter((s) => s.done).length || 0;
              const percentSteps = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

              return (
                <div
                  key={incident.id}
                  id={`incident-card-${incident.id}`}
                  onClick={() => {
                    playClick();
                    onSelectIncident(incident.id);
                  }}
                  className="p-4 hover:bg-[#1B2540]/60 transition-colors cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Incident ID */}
                      <span className="font-mono text-xs font-bold text-[#F2A93B]">
                        IR-{incident.id}
                      </span>

                      {/* Severity Badge */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          incident.severity === 'critical'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : incident.severity === 'high'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : incident.severity === 'medium'
                            ? 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {incident.severity}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          incident.status === 'open'
                            ? 'bg-red-950/60 text-red-300 border border-red-800'
                            : incident.status === 'contained'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            : 'bg-[#1B2540] text-[#2DD4BF] border border-[#223055]'
                        }`}
                      >
                        {incident.status}
                      </span>

                      {/* Incident Type Label */}
                      <span className="text-xs text-[#9AA5B8] font-mono">
                        · {playbook?.label || incident.incident_type}
                      </span>
                    </div>

                    {/* Incident Title */}
                    <h3 className="text-sm font-semibold text-[#E8EAED] group-hover:text-[#F2A93B] transition-colors line-clamp-1">
                      {incident.title}
                    </h3>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9AA5B8] font-mono">
                      <span>Affected: {incident.affected_systems}</span>
                      <span>Logged: {formatUtcDateTime(incident.created_at)}</span>
                      {incident.customer_data_involved && (
                        <span className="text-[#F2A93B]">⚠ Customer PII</span>
                      )}
                      {incident.card_data_involved && (
                        <span className="text-[#E5484D]">⚠ Cardholder PAN</span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Playbook Progress Bar */}
                  <div className="w-full lg:w-48 shrink-0 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-[#9AA5B8]">
                      <span>Playbook Progress</span>
                      <span className="font-bold text-[#E8EAED]">
                        {completedSteps}/{totalSteps} ({percentSteps}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#0B1220] h-2 rounded-full overflow-hidden border border-[#223055]">
                      <div
                        className="bg-[#2DD4BF] h-full transition-all duration-300"
                        style={{ width: `${percentSteps}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Right Column: Regulatory & SLA Clocks + Ring */}
                  <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
                    {/* Regulatory Badges */}
                    <div className="text-right space-y-1">
                      {regClocks.slice(0, 2).map((c) => (
                        <div key={c.regulator} className="flex items-center justify-end gap-1.5 text-[11px] font-mono">
                          <span className="text-[#9AA5B8]">{c.regulator}:</span>
                          {c.isBreached ? (
                            <span className="text-[#E5484D] font-bold px-1 rounded bg-red-950 border border-red-800">
                              BREACHED
                            </span>
                          ) : c.hoursRemaining !== null ? (
                            <span
                              className={`font-semibold ${
                                c.hoursRemaining < 4
                                  ? 'text-[#E5484D]'
                                  : c.hoursRemaining < 12
                                  ? 'text-[#F2A93B]'
                                  : 'text-[#2DD4BF]'
                              }`}
                            >
                              {c.hoursRemaining}h left
                            </span>
                          ) : (
                            <span className="text-[#6B7A99]">-</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Countdown Ring */}
                    <CountdownRing metrics={sla} size={54} strokeWidth={4} />

                    <ChevronRight className="w-4 h-4 text-[#9AA5B8] group-hover:text-[#E8EAED] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
