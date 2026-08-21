import React from 'react';
import { playClick, playAlertSiren } from '../utils/audio';
import { FastForward, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface TimeWarpSimulatorProps {
  offsetHours: number;
  onSetOffsetHours: (hours: number) => void;
  onResetTime: () => void;
}

export function TimeWarpSimulator({
  offsetHours,
  onSetOffsetHours,
  onResetTime,
}: TimeWarpSimulatorProps) {
  const simulatedDate = new Date(Date.now() + offsetHours * 60 * 60 * 1000);

  const presets = [
    { label: '+1h', hours: 1, desc: 'Triage Stage' },
    { label: '+4h', hours: 4, desc: 'Critical SLA Threshold' },
    { label: '+12h', hours: 12, desc: 'High Severity SLA' },
    { label: '+23h', hours: 23, desc: 'CBN 24h Warning' },
    { label: '+25h', hours: 25, desc: 'CBN Breach Test' },
    { label: '+71h', hours: 71, desc: 'NDPR 72h Warning' },
    { label: '+73h', hours: 73, desc: 'NDPR Breach Test' },
  ];

  return (
    <div className="bg-[#131B2E] border border-[#223055] p-3 rounded text-xs font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Status */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
            <FastForward className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#E8EAED]">STATUTORY CLOCK TIME-WARP ENGINE</span>
              {offsetHours > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 animate-pulse text-[10px]">
                  SIMULATION ACTIVE: +{offsetHours}h
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9AA5B8] font-sans">
              Advance time forward to simulate Central Bank of Nigeria (24h) & NDPR (72h) regulatory SLA expirations.
            </p>
          </div>
        </div>

        {/* Right Time Display & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#6B7A99]">SIMULATED CLOCK (UTC)</div>
            <div className="text-xs font-bold text-[#2DD4BF]">
              {simulatedDate.toISOString().replace('T', ' ').substring(0, 19)} UTC
            </div>
          </div>

          {offsetHours > 0 && (
            <button
              type="button"
              onClick={() => {
                playClick();
                onResetTime();
              }}
              className="px-2.5 py-1.5 rounded bg-[#1B2540] hover:bg-[#223055] text-amber-300 border border-amber-800 text-xs flex items-center gap-1 transition-colors"
              title="Reset simulation to real current time"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Real Time</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-[#223055]/60">
        <span className="text-[11px] text-[#9AA5B8] mr-1">Fast Forward:</span>
        {presets.map((p) => {
          const isSelected = offsetHours === p.hours;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                if (p.hours >= 24) {
                  playAlertSiren();
                } else {
                  playClick();
                }
                onSetOffsetHours(p.hours);
              }}
              title={p.desc}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#2DD4BF] text-[#0B1220] font-bold shadow'
                  : p.hours >= 24
                  ? 'bg-[#1B2540] hover:bg-red-950 text-red-300 border border-red-900/60'
                  : 'bg-[#1B2540] hover:bg-[#223055] text-[#9AA5B8] hover:text-[#E8EAED] border border-[#223055]'
              }`}
            >
              <span>{p.label}</span>
              <span className="text-[9px] opacity-70 hidden sm:inline">({p.desc})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
