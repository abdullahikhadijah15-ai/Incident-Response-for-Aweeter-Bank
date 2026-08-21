import React, { useState } from 'react';
import { playClick } from '../utils/audio';
import { Calculator, AlertTriangle, ShieldAlert, DollarSign, HelpCircle } from 'lucide-react';

interface BreachFineCalculatorProps {
  initialCustomerData?: boolean;
  initialCardData?: boolean;
}

export function BreachFineCalculator({
  initialCustomerData = true,
  initialCardData = false,
}: BreachFineCalculatorProps) {
  const [affectedUsers, setAffectedUsers] = useState<number>(1200);
  const [hasPii, setHasPii] = useState<boolean>(initialCustomerData);
  const [hasCard, setHasCard] = useState<boolean>(initialCardData);
  const [isCbnDelayed, setIsCbnDelayed] = useState<boolean>(false);
  const [isNdprDelayed, setIsNdprDelayed] = useState<boolean>(false);

  // Statutory Calculations
  // NDPA Section 48: Greater of N10,000,000 or 2% of annual gross revenue for major data controller
  const baseNdprFine = hasPii ? (isNdprDelayed ? 10_000_000 : 2_000_000) : 0;
  // CBN Circular penalty: N5M - N20M per day of un-notified systemic breach
  const baseCbnFine = isCbnDelayed ? 15_000_000 : 0;
  // Card Brand indemnity assessment (~$50 per card account compromised)
  const cardReissuanceCost = hasCard ? affectedUsers * 4500 : 0;
  // User remediation and credit monitoring
  const remediationCost = hasPii ? affectedUsers * 2500 : 0;

  const totalEstimatedExposure = baseNdprFine + baseCbnFine + cardReissuanceCost + remediationCost;

  const formatNaira = (num: number) => {
    return `₦${(num / 1_000_000).toFixed(2)}M`;
  };

  return (
    <div className="bg-[#131B2E] border border-[#223055] p-4 rounded text-xs font-mono space-y-4">
      <div className="flex items-center justify-between border-b border-[#223055] pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#F2A93B]" />
          <span className="font-bold text-[#E8EAED] text-sm">
            STATUTORY BREACH EXPOSURE & FINE CALCULATOR
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1B2540] text-[#F2A93B] border border-[#223055]">
          CBN & NDPA ACT (SEC 48)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="space-y-3 bg-[#0B1220] p-3 rounded border border-[#223055]">
          <div>
            <div className="flex justify-between text-[#9AA5B8] mb-1">
              <span>Estimated Affected Customers / Records:</span>
              <span className="font-bold text-[#E8EAED]">{affectedUsers.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="50"
              max="50000"
              step="50"
              value={affectedUsers}
              onChange={(e) => {
                setAffectedUsers(Number(e.target.value));
              }}
              className="w-full accent-[#2DD4BF] cursor-pointer"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-[#E8EAED] cursor-pointer">
              <input
                type="checkbox"
                checked={hasPii}
                onChange={(e) => setHasPii(e.target.checked)}
                className="rounded bg-[#131B2E] border-[#223055] text-[#2DD4BF]"
              />
              <span>Customer PII Exposed (Triggers NDPA / NDPR Filing)</span>
            </label>

            <label className="flex items-center gap-2 text-[#E8EAED] cursor-pointer">
              <input
                type="checkbox"
                checked={hasCard}
                onChange={(e) => setHasCard(e.target.checked)}
                className="rounded bg-[#131B2E] border-[#223055] text-[#2DD4BF]"
              />
              <span>Card PAN / CVV Compromise (Triggers PCI-DSS Reissuance)</span>
            </label>

            <label className="flex items-center gap-2 text-red-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCbnDelayed}
                onChange={(e) => setIsCbnDelayed(e.target.checked)}
                className="rounded bg-[#131B2E] border-[#223055] text-red-400"
              />
              <span>CBN 24h Window Missed (Statutory Non-Compliance Surcharge)</span>
            </label>

            <label className="flex items-center gap-2 text-red-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isNdprDelayed}
                onChange={(e) => setIsNdprDelayed(e.target.checked)}
                className="rounded bg-[#131B2E] border-[#223055] text-red-400"
              />
              <span>NDPR 72h Window Missed (Maximum Statutory Fine Applied)</span>
            </label>
          </div>
        </div>

        {/* Output Assessment Box */}
        <div className="bg-[#0B1220] p-4 rounded border border-[#223055] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="text-[#9AA5B8] text-[11px] uppercase tracking-wider">
              Projected Exposure Breakdown:
            </div>

            <div className="flex justify-between border-b border-[#223055]/60 pb-1 text-[#E8EAED]">
              <span>NDPA / NDPR Statutory Assessment:</span>
              <span className="font-bold">{formatNaira(baseNdprFine)}</span>
            </div>

            <div className="flex justify-between border-b border-[#223055]/60 pb-1 text-[#E8EAED]">
              <span>CBN Regulatory Non-Compliance:</span>
              <span className="font-bold">{formatNaira(baseCbnFine)}</span>
            </div>

            <div className="flex justify-between border-b border-[#223055]/60 pb-1 text-[#E8EAED]">
              <span>Card Reissuance & Indemnity:</span>
              <span className="font-bold">{formatNaira(cardReissuanceCost)}</span>
            </div>

            <div className="flex justify-between border-b border-[#223055]/60 pb-1 text-[#E8EAED]">
              <span>Customer Remediation & Audit:</span>
              <span className="font-bold">{formatNaira(remediationCost)}</span>
            </div>
          </div>

          <div className="p-3 rounded bg-[#181216] border border-red-900/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-red-400">TOTAL ESTIMATED EXPOSURE</div>
              <div className="text-xl font-bold text-red-300">{formatNaira(totalEstimatedExposure)}</div>
            </div>
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
