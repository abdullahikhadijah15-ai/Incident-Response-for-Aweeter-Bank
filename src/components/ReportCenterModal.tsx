import React, { useState } from 'react';
import { Incident } from '../types';
import {
  generateIncidentPdf,
  generateSocSummaryPdf,
  downloadIncidentsCsv,
  downloadRegulatoryAuditCsv,
  downloadAllIncidentsJson,
  downloadIncidentJson,
  downloadIncidentMarkdown,
} from '../utils/pdfExport';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Building,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

interface ReportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  currentIncident?: Incident;
  offsetHours: number;
}

export const ReportCenterModal: React.FC<ReportCenterModalProps> = ({
  isOpen,
  onClose,
  incidents,
  currentIncident,
  offsetHours,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(
    currentIncident?.id || (incidents.length > 0 ? incidents[0].id : 0)
  );
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const simulatedNow = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const selectedInc = incidents.find((i) => i.id === selectedIncidentId) || currentIncident || incidents[0];

  const handleDownload = (type: string, action: () => void, label: string) => {
    action();
    setDownloadSuccess(label);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="report-center-modal"
        className="bg-[#131B2E] border border-[#223055] rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#223055] flex items-center justify-between bg-[#0B1220]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1B2540] border border-[#223055] flex items-center justify-center text-[#F2A93B]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E8EAED] font-mono">
                  AWEETER/IR · REPORT & EXPORT CENTER
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
                  OFFICIAL AUDIT EXPORTS
                </span>
              </div>
              <p className="text-xs text-[#9AA5B8] mt-0.5">
                Generate high-fidelity PDFs, audit CSVs, and forensic data packages for management, CBN, and NDPR compliance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9AA5B8] hover:text-[#E8EAED] hover:bg-[#1B2540] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="px-5 py-2.5 bg-teal-950 border-b border-teal-600/80 flex items-center gap-2 text-xs font-mono text-teal-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Successfully generated and downloaded: <strong>{downloadSuccess}</strong></span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Master SOC Reports (All Incidents) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#F2A93B] font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>1. SOC-Wide Executive & Audit Reports ({incidents.length} Records)</span>
              </span>
              <span className="text-[11px] font-mono text-[#6B7A99]">System of Record</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Master PDF Report */}
              <div className="p-4 rounded bg-[#0B1220] border border-[#223055] hover:border-[#F2A93B]/60 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#E8EAED] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#F2A93B]" />
                      <span>Executive SOC Master Summary</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      PDF (A4)
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA5B8] mt-1.5 leading-relaxed">
                    Landscape audit report with executive metrics, open threat breakdown, SLA adherence ledger, and regulatory clock overview.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-soc-master-pdf-btn"
                  onClick={() =>
                    handleDownload(
                      'soc-pdf',
                      () => generateSocSummaryPdf(incidents, simulatedNow),
                      'Executive SOC Master Summary PDF'
                    )
                  }
                  className="mt-3.5 w-full py-2 bg-[#F2A93B] hover:bg-[#e09b32] text-[#0B1220] font-bold text-xs rounded font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Master PDF Report</span>
                </button>
              </div>

              {/* Complete Incident Registry CSV */}
              <div className="p-4 rounded bg-[#0B1220] border border-[#223055] hover:border-[#2DD4BF]/60 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#E8EAED] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#2DD4BF]" />
                      <span>Incident Registry Ledger</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      CSV / Excel
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA5B8] mt-1.5 leading-relaxed">
                    Full spreadsheet table with all incident IDs, vectors, severity, timestamps, affected systems, PII/card flags, and step counts.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-incidents-csv-btn"
                  onClick={() =>
                    handleDownload(
                      'registry-csv',
                      () => downloadIncidentsCsv(incidents),
                      'Incident Registry CSV'
                    )
                  }
                  className="mt-3.5 w-full py-2 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] text-[#2DD4BF] hover:text-white font-bold text-xs rounded font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Registry CSV</span>
                </button>
              </div>

              {/* Regulatory Compliance Audit CSV */}
              <div className="p-4 rounded bg-[#0B1220] border border-[#223055] hover:border-[#2DD4BF]/60 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#E8EAED] flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#2DD4BF]" />
                      <span>Statutory Regulatory Audit</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      CSV (CBN/NDPR)
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA5B8] mt-1.5 leading-relaxed">
                    Detailed compliance matrix showing every incident against statutory 72h/4h deadlines with hours remaining and breach status.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-regulatory-csv-btn"
                  onClick={() =>
                    handleDownload(
                      'reg-csv',
                      () => downloadRegulatoryAuditCsv(incidents, simulatedNow),
                      'Regulatory Compliance Audit CSV'
                    )
                  }
                  className="mt-3.5 w-full py-2 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] text-[#2DD4BF] hover:text-white font-bold text-xs rounded font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Regulatory Audit CSV</span>
                </button>
              </div>

              {/* Full Database JSON Archive */}
              <div className="p-4 rounded bg-[#0B1220] border border-[#223055] hover:border-[#9AA5B8]/60 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#E8EAED] flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-[#9AA5B8]" />
                      <span>Full Forensic Database Backup</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2540] text-[#9AA5B8] border border-[#223055]">
                      JSON
                    </span>
                  </div>
                  <p className="text-xs text-[#9AA5B8] mt-1.5 leading-relaxed">
                    Complete raw JSON database backup containing all incidents, full action logs, playbook steps, and system configurations.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-full-json-btn"
                  onClick={() =>
                    handleDownload(
                      'db-json',
                      () => downloadAllIncidentsJson(incidents),
                      'Complete Forensic Database JSON Backup'
                    )
                  }
                  className="mt-3.5 w-full py-2 bg-[#1B2540] hover:bg-[#223055] border border-[#223055] text-[#9AA5B8] hover:text-[#E8EAED] font-bold text-xs rounded font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Database Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Individual Incident Reports */}
          <div className="border-t border-[#223055] pt-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#F2A93B] font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>2. Individual Incident Report Generator</span>
              </span>

              {/* Select Incident dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-mono text-[#9AA5B8]">Select Record:</span>
                <select
                  id="report-incident-selector"
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(Number(e.target.value))}
                  className="flex-1 sm:w-64 px-2.5 py-1 bg-[#0B1220] border border-[#223055] rounded text-xs text-[#E8EAED] font-mono focus:outline-none focus:border-[#F2A93B]"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      IR-{inc.id}: {inc.title.substring(0, 32)}... ({inc.severity.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedInc && (
              <div className="p-4 rounded bg-[#0B1220] border border-[#223055] space-y-4">
                {/* Selected incident preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1B2540]">
                  <div>
                    <span className="text-xs font-bold font-mono text-[#F2A93B]">
                      IR-{selectedInc.id}: {selectedInc.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#9AA5B8] mt-0.5">
                      <span className="uppercase">{selectedInc.severity} SEVERITY</span>
                      <span>•</span>
                      <span className="uppercase">{selectedInc.status}</span>
                      <span>•</span>
                      <span>{selectedInc.steps?.filter((s) => s.done).length || 0}/{selectedInc.steps?.length || 0} Playbook Steps Done</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#6B7A99]">
                    Ready for instant download
                  </span>
                </div>

                {/* 4 Download Options for Selected Incident */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* PDF */}
                  <button
                    type="button"
                    id="download-single-pdf-btn"
                    onClick={() =>
                      handleDownload(
                        'single-pdf',
                        () => generateIncidentPdf(selectedInc),
                        `IR-${selectedInc.id} Official PDF Report`
                      )
                    }
                    className="p-3 rounded bg-[#1B2540] hover:bg-[#223055] border border-[#F2A93B]/40 hover:border-[#F2A93B] text-left transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#F2A93B] font-bold block">
                        Official PDF
                      </span>
                      <span className="text-[10px] text-[#9AA5B8] block mt-0.5">
                        Formal A4 Report
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#E8EAED] font-mono font-bold">
                      <Download className="w-3.5 h-3.5 text-[#F2A93B]" />
                      <span>.PDF</span>
                    </div>
                  </button>

                  {/* CSV */}
                  <button
                    type="button"
                    id="download-single-csv-btn"
                    onClick={() =>
                      handleDownload(
                        'single-csv',
                        () => downloadIncidentsCsv([selectedInc], `Aweeter-IR-${selectedInc.id}-Report.csv`),
                        `IR-${selectedInc.id} CSV Report`
                      )
                    }
                    className="p-3 rounded bg-[#1B2540] hover:bg-[#223055] border border-[#2DD4BF]/40 hover:border-[#2DD4BF] text-left transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#2DD4BF] font-bold block">
                        Spreadsheet
                      </span>
                      <span className="text-[10px] text-[#9AA5B8] block mt-0.5">
                        Structured CSV
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#E8EAED] font-mono font-bold">
                      <Download className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span>.CSV</span>
                    </div>
                  </button>

                  {/* JSON */}
                  <button
                    type="button"
                    id="download-single-json-btn"
                    onClick={() =>
                      handleDownload(
                        'single-json',
                        () => downloadIncidentJson(selectedInc),
                        `IR-${selectedInc.id} Forensic JSON Record`
                      )
                    }
                    className="p-3 rounded bg-[#1B2540] hover:bg-[#223055] border border-[#223055] hover:border-[#9AA5B8] text-left transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#9AA5B8] font-bold block">
                        Forensic Data
                      </span>
                      <span className="text-[10px] text-[#9AA5B8] block mt-0.5">
                        Raw JSON Object
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#E8EAED] font-mono font-bold">
                      <Download className="w-3.5 h-3.5 text-[#9AA5B8]" />
                      <span>.JSON</span>
                    </div>
                  </button>

                  {/* Briefing MD */}
                  <button
                    type="button"
                    id="download-single-md-btn"
                    onClick={() =>
                      handleDownload(
                        'single-md',
                        () => downloadIncidentMarkdown(selectedInc),
                        `IR-${selectedInc.id} Markdown Briefing`
                      )
                    }
                    className="p-3 rounded bg-[#1B2540] hover:bg-[#223055] border border-[#223055] hover:border-[#9AA5B8] text-left transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#9AA5B8] font-bold block">
                        Briefing Doc
                      </span>
                      <span className="text-[10px] text-[#9AA5B8] block mt-0.5">
                        Markdown / Text
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#E8EAED] font-mono font-bold">
                      <Download className="w-3.5 h-3.5 text-[#9AA5B8]" />
                      <span>.MD</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B1220] border-t border-[#223055] flex items-center justify-between">
          <span className="text-xs font-mono text-[#6B7A99]">
            Aweeter Bank SOC Sentinel/IR · Compliant with CBN Cybersecurity Guidelines & NDPR
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1B2540] hover:bg-[#223055] text-[#E8EAED] font-mono text-xs rounded border border-[#223055] transition-colors"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
