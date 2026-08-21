import React, { useState, useEffect } from 'react';
import { SOCOperator } from '../types';
import { isSoundEnabled, toggleSound, playClick } from '../utils/audio';
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  LogOut,
  Download,
  Radio,
  LayoutDashboard,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateNew: () => void;
  onNavigateComms?: () => void;
  onOpenReportCenter?: () => void;
  onResetData?: () => void;
  onLogout: () => void;
  currentView: 'dashboard' | 'new' | 'detail' | 'comms';
  authenticatedOperator: SOCOperator | null;
  offsetHours: number;
  commsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateNew,
  onNavigateComms,
  onOpenReportCenter,
  onResetData,
  onLogout,
  currentView,
  authenticatedOperator,
  offsetHours,
  commsCount = 5,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [offsetHours]);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <header className="bg-[#131B2E] border-b border-[#223055] sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Navigation links */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => {
              playClick();
              onNavigateHome();
            }}
          >
            <div className="w-9 h-9 rounded bg-[#1B2540] border border-[#223055] flex items-center justify-center text-[#F2A93B]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span id="brand-logo" className="font-mono text-base font-bold tracking-wider text-[#E8EAED]">
                  ◈ AWEETER/IR
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
                  BANK SOC
                </span>
                {offsetHours > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                    +{offsetHours}h WARP
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9AA5B8] leading-tight">
                Aweeter Bank Security Operations Center · Incident Lifecycle Console
              </p>
            </div>
          </div>

          {/* Primary View Toggle Links */}
          <div className="hidden md:flex items-center gap-1 bg-[#0B1220] p-1 rounded border border-[#223055] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                playClick();
                onNavigateHome();
              }}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-[#1B2540] text-[#2DD4BF] font-semibold'
                  : 'text-[#9AA5B8] hover:text-[#E8EAED]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>

            {onNavigateComms && (
              <button
                type="button"
                id="nav-comms-button"
                onClick={() => {
                  playClick();
                  onNavigateComms();
                }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  currentView === 'comms'
                    ? 'bg-[#1B2540] text-[#2DD4BF] font-semibold'
                    : 'text-[#9AA5B8] hover:text-[#E8EAED]'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-[#F2A93B]" />
                <span>Communications</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#131B2E] text-[#2DD4BF] border border-[#223055]">
                  {commsCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Live Clock, Operator Badge & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Audio Synthesizer Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={soundOn ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
            className="p-2 rounded bg-[#0B1220] hover:bg-[#1B2540] text-[#9AA5B8] hover:text-[#2DD4BF] border border-[#223055] transition-colors text-xs"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-[#2DD4BF]" /> : <VolumeX className="w-3.5 h-3.5 text-[#6B7A99]" />}
          </button>

          {/* UTC Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0B1220] border border-[#223055] text-[#9AA5B8] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse"></span>
            <span>{utcTime || 'SYNCING UTC...'}</span>
          </div>

          {/* Authenticated Operator Chip */}
          {authenticatedOperator && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0B1220] border border-[#223055] text-xs font-mono">
              <div className="w-6 h-6 rounded bg-[#1B2540] border border-[#223055] flex items-center justify-center text-[10px] font-bold text-[#F2A93B]">
                {authenticatedOperator.avatarInitials}
              </div>
              <div className="hidden sm:block">
                <span className="text-[#E8EAED] font-bold block leading-none">
                  {authenticatedOperator.name}
                </span>
                <span className="text-[9px] text-[#6B7A99] block leading-tight">
                  {authenticatedOperator.badgeId} · {authenticatedOperator.clearanceLevel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onLogout();
                }}
                title="Sign Out / Switch Operator"
                className="ml-1 p-1 text-[#9AA5B8] hover:text-[#E5484D] hover:bg-[#1B2540] rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reports & Export Center Trigger */}
          {onOpenReportCenter && (
            <button
              id="nav-download-reports-btn"
              onClick={() => {
                playClick();
                onOpenReportCenter();
              }}
              title="Open Report & Export Center (PDF, CSV, JSON)"
              className="px-2.5 py-1.5 text-xs font-mono text-[#2DD4BF] hover:text-white bg-[#1B2540] hover:bg-[#223055] border border-[#223055] hover:border-[#2DD4BF]/50 rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#2DD4BF]" />
              <span className="hidden sm:inline">Reports & Export</span>
              <span className="sm:hidden">Reports</span>
            </button>
          )}

          {onResetData && (
            <button
              id="reset-demo-btn"
              onClick={() => {
                playClick();
                onResetData();
              }}
              title="Reset sample incident queue"
              className="px-2 py-1.5 text-xs text-[#9AA5B8] hover:text-[#E8EAED] bg-[#1B2540] hover:bg-[#223055] rounded border border-[#223055] transition-colors flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">Reset Queue</span>
            </button>
          )}

          {currentView !== 'new' && (
            <button
              id="log-incident-nav-btn"
              onClick={() => {
                playClick();
                onNavigateNew();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0B1220] bg-[#F2A93B] hover:bg-[#e09b32] active:bg-[#c98725] rounded transition-colors flex items-center gap-1.5 shadow-sm font-sans"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Incident</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
