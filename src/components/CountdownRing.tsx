import React from 'react';
import { SLAMetrics } from '../types';

interface CountdownRingProps {
  metrics: SLAMetrics;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  metrics,
  size = 'sm',
  showLabel = true,
}) => {
  const { percentRemaining, color, status, displayText } = metrics;

  // If status is 'met', display 100% full teal circle with checkmark
  const fillPercent = status === 'met' ? 100 : percentRemaining;
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(${color} ${fillPercent}%, #1B2540 0)`,
  };

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center justify-center">
        <div
          id="sla-countdown-donut-lg"
          className="sla-donut-ring-lg transition-all duration-500"
          style={ringStyle}
          title={`SLA: ${displayText}`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-1">
            {status === 'met' ? (
              <div className="flex flex-col items-center">
                <span className="text-teal-400 text-xl font-bold font-mono">✓</span>
                <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase font-semibold">MET</span>
              </div>
            ) : status === 'breached' ? (
              <div className="flex flex-col items-center">
                <span className="text-red-400 text-lg font-bold font-mono">!</span>
                <span className="text-[10px] text-red-400 font-mono tracking-wider uppercase font-semibold">BREACH</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold font-mono text-slate-100">{displayText}</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">SLA Left</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className="sla-donut-ring-md transition-all duration-500"
        style={ringStyle}
        title={`SLA: ${displayText}`}
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {status === 'met' ? (
            <span className="text-teal-400 text-sm font-bold font-mono">✓</span>
          ) : (
            <span className="text-[11px] font-bold font-mono text-slate-200">{displayText}</span>
          )}
        </div>
      </div>
    );
  }

  // Small (default for table rows)
  return (
    <div
      className="sla-donut-ring transition-all duration-500"
      style={ringStyle}
      title={`Containment SLA: ${metrics.formattedTimeLeft}`}
    >
      <div className="relative z-10 flex items-center justify-center text-center">
        {status === 'met' ? (
          <span className="text-teal-400 text-xs font-bold font-mono">✓</span>
        ) : (
          showLabel && (
            <span className="text-[10px] font-bold font-mono" style={{ color }}>
              {Math.round(percentRemaining)}%
            </span>
          )
        )}
      </div>
    </div>
  );
};
