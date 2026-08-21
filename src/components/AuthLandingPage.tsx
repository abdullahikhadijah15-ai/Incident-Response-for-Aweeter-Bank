import React, { useState } from 'react';
import { SOCOperator, Incident } from '../types';
import { PRESET_OPERATORS } from '../data/operators';
import { playClick, playSuccessChime, playAlertSiren, playRadioTransmission } from '../utils/audio';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Radio,
  Server,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface AuthLandingPageProps {
  onAuthenticate: (operator: SOCOperator) => void;
  activeIncidents?: Incident[];
}

export function AuthLandingPage({ onAuthenticate, activeIncidents = [] }: AuthLandingPageProps) {
  const [selectedOperator, setSelectedOperator] = useState<SOCOperator>(PRESET_OPERATORS[0]);
  const [pinCode, setPinCode] = useState('8821');
  const [isScanning, setIsScanning] = useState(false);
  const [authMode, setAuthMode] = useState<'roster' | 'custom'>('roster');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('Senior Security Analyst');
  const [customBadge, setCustomBadge] = useState('SOC-9940');
  const [customClearance, setCustomClearance] = useState<'LEVEL 1' | 'LEVEL 2' | 'LEVEL 3' | 'COGNITIVE TOP SECRET'>('LEVEL 3');
  const [scanStep, setScanStep] = useState<string>('');

  const criticalCount = activeIncidents.filter((i) => i.severity === 'critical' && i.status === 'open').length;
  const openCount = activeIncidents.filter((i) => i.status === 'open').length;

  const handleSelectPreset = (op: SOCOperator) => {
    playClick();
    setSelectedOperator(op);
    setPinCode(op.badgeId.replace(/\D/g, '') || '8821');
  };

  const handleTriggerAuth = (operatorToAuth: SOCOperator) => {
    setIsScanning(true);
    playRadioTransmission();
    setScanStep('Establishing HSM Ephemeral Handshake...');

    setTimeout(() => {
      setScanStep('Verifying Central Bank of Nigeria Tier-3 SOC Clearance...');
    }, 450);

    setTimeout(() => {
      setScanStep(`Operator Identified: ${operatorToAuth.callsign} [${operatorToAuth.badgeId}]`);
    }, 850);

    setTimeout(() => {
      setIsScanning(false);
      playSuccessChime();
      onAuthenticate(operatorToAuth);
    }, 1300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const initials = customName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

    const customOp: SOCOperator = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      callsign: `OPERATOR-${customBadge.replace(/\D/g, '') || '01'}`,
      role: customRole,
      tier: customClearance === 'COGNITIVE TOP SECRET' ? 'CISO / Exec' : customClearance === 'LEVEL 3' ? 'Tier 3 Incident Lead' : 'Tier 2 SecOps',
      clearanceLevel: customClearance,
      email: `${customName.toLowerCase().replace(/\s+/g, '.')}@aweeterbank.com`,
      avatarInitials: initials,
      badgeId: customBadge.trim() || 'SOC-CUSTOM',
    };

    handleTriggerAuth(customOp);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E8EAED] flex flex-col justify-between selection:bg-[#F2A93B]/30">
      {/* Top Security Status Bar */}
      <header className="border-b border-[#223055] bg-[#0E1628]/90 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F2A93B]" />
              <span className="font-bold tracking-wider text-[#E8EAED]">AWEETER/IR</span>
            </div>
            <span className="text-[#6B7A99]">|</span>
            <span className="text-[#9AA5B8] hidden sm:inline">CYBER DEFENSE OPERATIONS CENTER</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
              GATEWAY: LAGOS-DC1
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#9AA5B8] text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse"></span>
              <span className="text-[#2DD4BF]">MUTUAL TLS 1.3 ACTIVE</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#6B7A99]" />
              <span>CBN CSF TIER-3 COMPLIANT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Card Grid */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Threat State Live Ticker */}
        {openCount > 0 && (
          <div className="mb-6 bg-[#131B2E] border border-amber-900/60 p-3.5 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-950 text-[#F2A93B] border border-amber-800 shrink-0">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="text-xs font-mono text-[#F2A93B] font-bold">
                  ACTIVE QUEUE: {openCount} OPEN INCIDENTS DETECTED ({criticalCount} CRITICAL)
                </div>
                <div className="text-xs text-[#9AA5B8]">
                  Mandatory 24h Central Bank of Nigeria (CBN) and 72h NDPR statutory clocks are running.
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-[#9AA5B8] shrink-0 bg-[#0B1220] px-3 py-1.5 rounded border border-[#223055]">
              DEFCON 2 · ELEVATED VIGILANCE
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Platform Branding & Mission */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1B2540] border border-[#223055] text-xs font-mono text-[#2DD4BF] mb-3">
                <Radio className="w-3.5 h-3.5 text-[#2DD4BF] animate-pulse" />
                <span>SECURE SOC ACCESS PORTAL</span>
              </div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-[#E8EAED]">
                AWEETER/IR
              </h1>
              <p className="text-sm text-[#9AA5B8] mt-2 leading-relaxed">
                Incident Response & Regulatory Communications Management Platform for Aweeter Bank PLC Security Operations.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-3 font-mono text-xs text-[#9AA5B8]">
              <div className="flex items-start gap-2.5 p-3 rounded bg-[#131B2E] border border-[#223055]">
                <ShieldCheck className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#E8EAED] font-semibold block">Regulatory SLA Countdown Engine</span>
                  Real-time statutory tracking for Central Bank of Nigeria (24h) and NDPR (72h) breach disclosures.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded bg-[#131B2E] border border-[#223055]">
                <Radio className="w-4 h-4 text-[#F2A93B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#E8EAED] font-semibold block">Incident War Room & Communications</span>
                  Multi-channel regulatory broadcast hub with 1-click official CBN and NDPR statutory draft dispatch.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded bg-[#131B2E] border border-[#223055]">
                <Lock className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#E8EAED] font-semibold block">Playbook Automation & Forensic Audit</span>
                  Phased containment runbooks, exportable executive PDF briefs, and immutable audit logs.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Officer Authentication Portal */}
          <div className="lg:col-span-7 bg-[#131B2E] border border-[#223055] rounded-lg p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Grid */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2DD4BF]/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-[#223055] pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold font-mono text-[#E8EAED] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F2A93B]" />
                  OPERATOR AUTHENTICATION
                </h2>
                <p className="text-xs text-[#9AA5B8] mt-0.5">Select a credentialed SOC operator or enter custom credentials.</p>
              </div>

              <div className="flex items-center gap-1 bg-[#0B1220] p-1 rounded border border-[#223055] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAuthMode('roster');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    authMode === 'roster'
                      ? 'bg-[#1B2540] text-[#2DD4BF] font-semibold'
                      : 'text-[#9AA5B8] hover:text-[#E8EAED]'
                  }`}
                >
                  SOC Roster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAuthMode('custom');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    authMode === 'custom'
                      ? 'bg-[#1B2540] text-[#2DD4BF] font-semibold'
                      : 'text-[#9AA5B8] hover:text-[#E8EAED]'
                  }`}
                >
                  Custom ID
                </button>
              </div>
            </div>

            {/* Scanning Overlay State */}
            {isScanning ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4 font-mono animate-fadeIn">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#2DD4BF] border-t-transparent animate-spin flex items-center justify-center">
                    <Fingerprint className="w-8 h-8 text-[#2DD4BF]" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-[#2DD4BF]/10 animate-ping"></div>
                </div>

                <div>
                  <div className="text-sm font-bold text-[#E8EAED]">AUTHENTICATING SECURITY CLEARANCE</div>
                  <div className="text-xs text-[#2DD4BF] mt-1 tracking-wide">{scanStep}</div>
                </div>

                <div className="w-48 bg-[#0B1220] h-1.5 rounded-full overflow-hidden border border-[#223055]">
                  <div className="bg-[#2DD4BF] h-full animate-pulse w-full"></div>
                </div>
              </div>
            ) : authMode === 'roster' ? (
              /* Mode 1: Preset Operator Roster */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {PRESET_OPERATORS.map((op) => {
                    const isSelected = selectedOperator.id === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => handleSelectPreset(op)}
                        className={`p-3 rounded border text-left transition-all relative ${
                          isSelected
                            ? 'bg-[#1B2540] border-[#2DD4BF] ring-1 ring-[#2DD4BF]/50 shadow-md'
                            : 'bg-[#0E1628] border-[#223055] hover:border-[#6B7A99] hover:bg-[#162038]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded font-mono font-bold text-xs flex items-center justify-center ${
                                isSelected ? 'bg-[#2DD4BF] text-[#0B1220]' : 'bg-[#1B2540] text-[#9AA5B8]'
                              }`}
                            >
                              {op.avatarInitials}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#E8EAED] leading-tight">{op.name}</div>
                              <div className="text-[10px] font-mono text-[#F2A93B]">{op.callsign}</div>
                            </div>
                          </div>

                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0B1220] text-[#9AA5B8] border border-[#223055]">
                            {op.badgeId}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#9AA5B8] mt-2 line-clamp-1">{op.role}</div>

                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#6B7A99]">{op.tier}</span>
                          <span
                            className={`px-1 rounded ${
                              op.clearanceLevel === 'COGNITIVE TOP SECRET'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-[#0B1220] text-[#2DD4BF]'
                            }`}
                          >
                            {op.clearanceLevel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Authentication Action Box */}
                <div className="bg-[#0B1220] border border-[#223055] p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#9AA5B8] font-mono">Selected Operator for Session:</div>
                    <div className="text-sm font-bold text-[#E8EAED] font-mono flex items-center gap-2 mt-0.5">
                      <span>{selectedOperator.name}</span>
                      <span className="text-xs text-[#2DD4BF]">({selectedOperator.badgeId})</span>
                    </div>
                  </div>

                  <button
                    id="authenticate-soc-button"
                    type="button"
                    onClick={() => handleTriggerAuth(selectedOperator)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#2DD4BF] hover:bg-[#26b8a5] text-[#0B1220] font-mono font-bold text-xs rounded flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>AUTHENTICATE & ENTER CONSOLE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 2: Custom Operator Credentials */
              <form onSubmit={handleCustomSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[#9AA5B8] mb-1">Operator Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima Mohammed"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] px-3 py-2 rounded outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#9AA5B8] mb-1">SOC Role Title</label>
                    <input
                      type="text"
                      required
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] px-3 py-2 rounded outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9AA5B8] mb-1">Badge Identifier</label>
                    <input
                      type="text"
                      required
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      className="w-full bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] px-3 py-2 rounded outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#9AA5B8] mb-1">Clearance Level</label>
                  <select
                    value={customClearance}
                    onChange={(e) => setCustomClearance(e.target.value as any)}
                    className="w-full bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] px-3 py-2 rounded outline-none"
                  >
                    <option value="LEVEL 1">LEVEL 1 · Triage & Intel</option>
                    <option value="LEVEL 2">LEVEL 2 · SecOps & Engineering</option>
                    <option value="LEVEL 3">LEVEL 3 · Lead Commander</option>
                    <option value="COGNITIVE TOP SECRET">COGNITIVE TOP SECRET · CISO & Legal</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2DD4BF] hover:bg-[#26b8a5] text-[#0B1220] font-mono font-bold text-xs rounded flex items-center justify-center gap-2 shadow transition-transform active:scale-95"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>ISSUE BADGE & INITIALIZE SESSION</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="border-t border-[#223055] bg-[#0E1628] py-3 px-4 text-center text-[11px] font-mono text-[#6B7A99]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AWEETER BANK PLC · INFORMATION SECURITY & RISK MANAGEMENT DIRECTORATE</span>
          <span>SYSTEM NOTICE: UNAUTHORIZED ACCESS ATTEMPTS ARE IMMUTABLY RECORDED</span>
        </div>
      </footer>
    </div>
  );
}
