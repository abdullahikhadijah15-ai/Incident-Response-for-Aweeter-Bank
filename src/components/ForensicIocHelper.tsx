import React, { useState } from 'react';
import { Incident } from '../types';
import { playClick, playSuccessChime } from '../utils/audio';
import { ShieldCheck, Search, Copy, Check, Plus, ExternalLink, Terminal, AlertTriangle } from 'lucide-react';

interface ForensicIocHelperProps {
  incident: Incident;
  onAddNote: (note: string) => void;
}

const SAMPLE_IOCS = [
  {
    type: 'IP Address',
    value: '197.210.226.44',
    reputation: 'Malicious Proxy / USSD Brute Force Cluster',
    geo: 'Lagos, NG (ASN 37148)',
  },
  {
    type: 'SHA-256',
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    reputation: 'Cobalt Strike Beacon Stager',
    geo: 'Known FinTech Credential Dropper',
  },
  {
    type: 'Domain',
    value: 'auth-aweeter-verify.secure-api-portal.net',
    reputation: 'Lookalike Phishing Domain',
    geo: 'Sinkholed by SOC DNS Firewall',
  },
  {
    type: 'API Webhook',
    value: 'https://gateway-04.settlement-bridge.io/v2/disburse',
    reputation: 'Spoofed Settlement Callback Endpoint',
    geo: 'Revoked & Null-Routed',
  },
];

export function ForensicIocHelper({ incident, onAddNote }: ForensicIocHelperProps) {
  const [customIoc, setCustomIoc] = useState('');
  const [iocType, setIocType] = useState('IP');
  const [copiedVal, setCopiedVal] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    playClick();
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 1800);
  };

  const handleAttachIoc = (ioc: (typeof SAMPLE_IOCS)[0]) => {
    playSuccessChime();
    onAddNote(`[FORENSIC IOC ATTACHED] ${ioc.type}: ${ioc.value} (${ioc.reputation} - ${ioc.geo})`);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIoc.trim()) return;
    playSuccessChime();
    onAddNote(`[FORENSIC IOC LOGGED] ${iocType}: ${customIoc.trim()} · Tagged for Firewall/WAF Null-route`);
    setCustomIoc('');
  };

  return (
    <div className="bg-[#131B2E] border border-[#223055] rounded p-4 text-xs font-mono space-y-4">
      <div className="flex items-center justify-between border-b border-[#223055] pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#2DD4BF]" />
          <span className="font-bold text-[#E8EAED] text-sm">
            INTERACTIVE FORENSIC IOC & TELEMETRY TOOLKIT
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
          SIEM & EDR TELEMETRY
        </span>
      </div>

      {/* Preset IOCs detected in this category */}
      <div>
        <div className="text-[11px] text-[#9AA5B8] mb-2">
          Detected Indicators of Compromise (IOCs) for triage verification:
        </div>
        <div className="space-y-2">
          {SAMPLE_IOCS.map((ioc) => (
            <div
              key={ioc.value}
              className="bg-[#0B1220] border border-[#223055] p-2.5 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-[#1B2540] text-[#F2A93B] text-[10px]">
                    {ioc.type}
                  </span>
                  <span className="font-bold text-[#E8EAED] break-all">{ioc.value}</span>
                </div>
                <div className="text-[11px] text-[#9AA5B8] font-sans">
                  {ioc.reputation} · <span className="text-[#6B7A99]">{ioc.geo}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(ioc.value)}
                  className="px-2 py-1 bg-[#1B2540] hover:bg-[#223055] text-[#9AA5B8] hover:text-[#E8EAED] rounded flex items-center gap-1 transition-colors"
                >
                  {copiedVal === ioc.value ? (
                    <Check className="w-3 h-3 text-[#2DD4BF]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAttachIoc(ioc)}
                  className="px-2 py-1 bg-[#2DD4BF]/20 hover:bg-[#2DD4BF]/30 text-[#2DD4BF] border border-[#2DD4BF]/50 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log to Audit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Custom IOC */}
      <form onSubmit={handleAddCustom} className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#223055]">
        <select
          value={iocType}
          onChange={(e) => setIocType(e.target.value)}
          className="bg-[#0B1220] border border-[#223055] text-[#E8EAED] px-2.5 py-1.5 rounded outline-none"
        >
          <option value="IP">IP Address</option>
          <option value="SHA-256">SHA-256 Hash</option>
          <option value="Domain">Domain / FQDN</option>
          <option value="Account">Bank Account ID</option>
          <option value="API-Key">Exposed Token</option>
        </select>

        <input
          type="text"
          placeholder="Enter forensic indicator..."
          value={customIoc}
          onChange={(e) => setCustomIoc(e.target.value)}
          className="flex-1 bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] px-3 py-1.5 rounded outline-none"
        />

        <button
          type="submit"
          disabled={!customIoc.trim()}
          className="px-3 py-1.5 bg-[#2DD4BF] hover:bg-[#26b8a5] disabled:opacity-50 text-[#0B1220] font-bold rounded flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record IOC</span>
        </button>
      </form>
    </div>
  );
}
