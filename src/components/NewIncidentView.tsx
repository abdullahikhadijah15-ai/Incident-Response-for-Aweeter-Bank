import React, { useState } from 'react';
import { IncidentTypeKey, Severity } from '../types';
import { INCIDENT_PLAYBOOKS, SEVERITY_SLA_HOURS } from '../data/config';
import { createIncident } from '../utils/storage';
import { ArrowLeft, ShieldAlert, CheckSquare, Clock, Building } from 'lucide-react';

interface NewIncidentViewProps {
  onIncidentCreated: (newId: number) => void;
  onCancel: () => void;
}

export const NewIncidentView: React.FC<NewIncidentViewProps> = ({
  onIncidentCreated,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentTypeKey>('account_takeover');
  const [severity, setSeverity] = useState<Severity>('high');
  const [affectedSystems, setAffectedSystems] = useState('');
  const [description, setDescription] = useState('');
  const [customerDataInvolved, setCustomerDataInvolved] = useState(false);
  const [cardDataInvolved, setCardDataInvolved] = useState(false);
  const [author, setAuthor] = useState('SOC Analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle type selection and update default severity accordingly
  const handleTypeChange = (newType: IncidentTypeKey) => {
    setIncidentType(newType);
    const config = INCIDENT_PLAYBOOKS[newType];
    if (config) {
      setSeverity(config.defaultSeverity);
    }
  };

  const selectedConfig = INCIDENT_PLAYBOOKS[incidentType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Incident Title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Incident Description is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = createIncident({
        title: title.trim(),
        incident_type: incidentType,
        severity,
        affected_systems: affectedSystems.trim() || 'Core Banking & Infrastructure',
        description: description.trim(),
        customer_data_involved: customerDataInvolved,
        card_data_involved: cardDataInvolved,
        author: author.trim() || 'SOC Analyst',
      });

      onIncidentCreated(created.id);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create incident. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-queue-btn"
          onClick={onCancel}
          className="text-xs font-mono text-[#9AA5B8] hover:text-[#E8EAED] flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131B2E] border border-[#223055] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Queue</span>
        </button>

        <div className="flex items-center gap-2 font-mono text-xs text-[#9AA5B8]">
          <span className="w-2 h-2 rounded-full bg-[#F2A93B]"></span>
          <span>PROTOCOL: RFC-IR-04</span>
        </div>
      </div>

      <div className="bg-[#131B2E] border border-[#223055] rounded">
        {/* Form Header */}
        <div className="p-5 border-b border-[#223055] flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#E8EAED] font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#F2A93B]" />
              <span>Log Security Incident & Seed Playbook</span>
            </h1>
            <p className="text-xs text-[#9AA5B8] mt-1">
              Initialize containment workflow, activate regulatory countdown timers, and dispatch playbook checklist.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="m-5 p-3 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono">
            ⚠ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9AA5B8] mb-1.5">
              Incident Title <span className="text-[#E5484D]">*</span>
            </label>
            <input
              id="new-incident-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Suspicious settlement divert on NIBSS bridge"
              className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#223055] rounded text-sm text-[#E8EAED] placeholder-[#6B7A99] focus:outline-none focus:border-[#F2A93B]"
            />
          </div>

          {/* Incident Type & Severity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Type Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9AA5B8] mb-1.5">
                Incident Classification / Type <span className="text-[#E5484D]">*</span>
              </label>
              <select
                id="new-incident-type"
                value={incidentType}
                onChange={(e) => handleTypeChange(e.target.value as IncidentTypeKey)}
                className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#223055] rounded text-sm text-[#E8EAED] focus:outline-none focus:border-[#F2A93B] font-mono"
              >
                {Object.values(INCIDENT_PLAYBOOKS).map((cfg) => (
                  <option key={cfg.key} value={cfg.key}>
                    {cfg.label} (Default: {cfg.defaultSeverity.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Override */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9AA5B8] mb-1.5">
                Assigned Severity
              </label>
              <select
                id="new-incident-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#223055] rounded text-sm text-[#E8EAED] focus:outline-none focus:border-[#F2A93B] font-mono"
              >
                <option value="critical">Critical (Containment SLA: 4 Hours)</option>
                <option value="high">High (Containment SLA: 12 Hours)</option>
                <option value="medium">Medium (Containment SLA: 24 Hours)</option>
                <option value="low">Low (Containment SLA: 72 Hours)</option>
              </select>
            </div>
          </div>

          {/* Type Playbook & Regulatory Clocks Preview */}
          {selectedConfig && (
            <div className="p-3.5 rounded bg-[#0B1220] border border-[#223055] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#F2A93B] font-bold">Auto-Loaded Playbook:</span>
                  <span className="text-[#E8EAED]">{selectedConfig.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[#9AA5B8]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#F2A93B]" />
                    SLA: {SEVERITY_SLA_HOURS[severity]}h Target
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    Regulators: {selectedConfig.regulators.join(', ')}
                  </span>
                </div>
              </div>

              {/* Playbook Steps preview count */}
              <div className="text-[11px] text-[#9AA5B8] font-mono flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-[#2DD4BF]" />
                <span>{selectedConfig.steps.length} sequential response steps will be seeded across 4 phases.</span>
              </div>
            </div>
          )}

          {/* Affected Systems */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9AA5B8] mb-1.5">
              Affected Systems / Endpoints / Infrastructure
            </label>
            <input
              id="new-incident-systems"
              type="text"
              value={affectedSystems}
              onChange={(e) => setAffectedSystems(e.target.value)}
              placeholder="e.g. Core Switch, API Gateway VIP, Redis Session Store"
              className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#223055] rounded text-sm text-[#E8EAED] placeholder-[#6B7A99] focus:outline-none focus:border-[#F2A93B] font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9AA5B8] mb-1.5">
              Incident Description & Initial Vector <span className="text-[#E5484D]">*</span>
            </label>
            <textarea
              id="new-incident-description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the anomalous indicators, detection source, and immediate risk context..."
              className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#223055] rounded text-sm text-[#E8EAED] placeholder-[#6B7A99] focus:outline-none focus:border-[#F2A93B]"
            />
          </div>

          {/* Checkboxes & Operator Info */}
          <div className="p-4 rounded bg-[#1B2540] border border-[#223055] space-y-3">
            <span className="block text-xs font-mono uppercase text-[#E8EAED] font-semibold">
              Data Scope & Operator Signature
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#E8EAED]">
                <input
                  id="new-incident-pii-checkbox"
                  type="checkbox"
                  checked={customerDataInvolved}
                  onChange={(e) => setCustomerDataInvolved(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0B1220] border-[#223055] text-[#F2A93B] focus:ring-0"
                />
                <span>Customer PII involved (Triggers NDPR/NITDA 72h window)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#E8EAED]">
                <input
                  id="new-incident-card-checkbox"
                  type="checkbox"
                  checked={cardDataInvolved}
                  onChange={(e) => setCardDataInvolved(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0B1220] border-[#223055] text-[#F2A93B] focus:ring-0"
                />
                <span>Card / Payment settlement data involved (Triggers NIBSS/CBN 24h)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-[#223055] flex items-center gap-3">
              <span className="text-xs font-mono text-[#9AA5B8]">Logging Analyst:</span>
              <input
                id="new-incident-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Analyst Name / Callout"
                className="px-2.5 py-1 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] font-mono focus:outline-none focus:border-[#F2A93B]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#223055]">
            <button
              type="button"
              id="cancel-incident-btn"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-mono text-[#9AA5B8] hover:text-[#E8EAED] hover:bg-[#1B2540] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-incident-btn"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#F2A93B] hover:bg-[#e09b32] disabled:opacity-50 text-[#0B1220] text-xs font-bold uppercase tracking-wider rounded font-sans transition-colors"
            >
              {isSubmitting ? 'Initializing Playbook...' : 'Submit & Seed Playbook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
