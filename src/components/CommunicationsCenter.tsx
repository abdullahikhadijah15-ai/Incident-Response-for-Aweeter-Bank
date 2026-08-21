import React, { useState } from 'react';
import { CommsMessage, CommsChannel, CommsPriority, Incident, SOCOperator } from '../types';
import { COMMS_TEMPLATES } from '../data/commsData';
import { playClick, playRadioTransmission, playSuccessChime, playAlertSiren } from '../utils/audio';
import {
  Radio,
  Send,
  ShieldAlert,
  Building2,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Lock,
  MessageSquare,
  Users,
  ChevronRight,
  Filter,
  Plus,
} from 'lucide-react';

interface CommunicationsCenterProps {
  messages: CommsMessage[];
  incidents: Incident[];
  currentIncidentId?: number | null;
  authenticatedOperator: SOCOperator;
  onSendMessage: (msg: Omit<CommsMessage, 'id' | 'timestamp'>) => void;
  onAddLogToIncident?: (incidentId: number, note: string, author: string) => void;
  onClose?: () => void;
}

export function CommunicationsCenter({
  messages,
  incidents,
  currentIncidentId,
  authenticatedOperator,
  onSendMessage,
  onAddLogToIncident,
  onClose,
}: CommunicationsCenterProps) {
  const [activeChannel, setActiveChannel] = useState<CommsChannel>('war-room');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(
    currentIncidentId || (incidents[0]?.id ?? 1042)
  );
  const [messageInput, setMessageInput] = useState('');
  const [messagePriority, setMessagePriority] = useState<CommsPriority>('CRITICAL');
  const [regulatoryTag, setRegulatoryTag] = useState<
    'CBN-MANDATORY' | 'NDPR-BREACH' | 'NIBSS-ALERT' | 'BOARD-BRIEF' | 'INTERNAL-SOC'
  >('INTERNAL-SOC');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoLogToIncident, setAutoLogToIncident] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const targetIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const filteredMessages = messages
    .filter((m) => activeChannel === 'war-room' || m.channel === activeChannel)
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.senderRole.toLowerCase().includes(q) ||
        (m.incidentId && `ir-${m.incidentId}`.includes(q))
      );
    });

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    playRadioTransmission();

    const newMsg: Omit<CommsMessage, 'id' | 'timestamp'> = {
      channel: activeChannel,
      incidentId: selectedIncidentId,
      senderName: authenticatedOperator.name,
      senderRole: authenticatedOperator.role,
      senderBadge: authenticatedOperator.badgeId,
      priority: messagePriority,
      content: messageInput.trim(),
      regulatoryTag: regulatoryTag,
      status: 'DISPATCHED',
    };

    onSendMessage(newMsg);

    // Auto-log to incident audit trail if enabled
    if (autoLogToIncident && onAddLogToIncident && selectedIncidentId) {
      const auditNote = `[COMMS DISPATCH #${activeChannel.toUpperCase()}] (${messagePriority}): ${messageInput.trim()}`;
      onAddLogToIncident(selectedIncidentId, auditNote, `${authenticatedOperator.name} (${authenticatedOperator.badgeId})`);
    }

    setMessageInput('');
    playSuccessChime();
  };

  const handleApplyTemplate = (templateObj: (typeof COMMS_TEMPLATES)[0]) => {
    playClick();
    if (!targetIncident) return;
    const rendered = templateObj.template(
      targetIncident.id,
      targetIncident.title,
      targetIncident.affected_systems || 'Core Systems'
    );
    setMessageInput(rendered);
    setActiveChannel(templateObj.channel);
    setMessagePriority(templateObj.priority);
    setRegulatoryTag(templateObj.regulatoryTag);
  };

  const handleCopyText = (id: string, text: string) => {
    playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const channels: { id: CommsChannel; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'war-room',
      label: 'All War-Room Feeds',
      icon: <Radio className="w-3.5 h-3.5" />,
      desc: 'Live tactical directives & team dispatches',
    },
    {
      id: 'regulatory-liaison',
      label: 'Regulatory & Statutory Liaison',
      icon: <Building2 className="w-3.5 h-3.5" />,
      desc: 'Central Bank of Nigeria (CBN) & NDPR filings',
    },
    {
      id: 'executive-brief',
      label: 'Executive & CISO Briefs',
      icon: <Lock className="w-3.5 h-3.5" />,
      desc: 'Board Risk Committee SitReps',
    },
    {
      id: 'customer-pr',
      label: 'Crisis PR & Customer Advisory',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      desc: 'Customer contact center scripts & media hold',
    },
  ];

  return (
    <div className="bg-[#0B1220] border border-[#223055] rounded-lg overflow-hidden shadow-2xl space-y-0 text-xs font-mono animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-[#131B2E] border-b border-[#223055] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
            <Radio className="w-4 h-4 text-[#2DD4BF] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#E8EAED] tracking-wide">
                AWEETER/IR · COMMUNICATIONS COMMAND CENTER
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B2540] text-[#2DD4BF] border border-[#223055]">
                ENCRYPTED AES-256
              </span>
            </div>
            <p className="text-[11px] text-[#9AA5B8] font-sans">
              Inter-operator war room dispatches, statutory Central Bank of Nigeria (CBN) & NDPR breach filings.
            </p>
          </div>
        </div>

        {/* Selected Incident Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[#9AA5B8] text-[11px]">Context Incident:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => {
              playClick();
              setSelectedIncidentId(Number(e.target.value));
            }}
            className="bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] text-xs px-2.5 py-1 rounded outline-none"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                IR-{inc.id} · {inc.title.substring(0, 32)}... ({inc.severity.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Side: Channel Selector & Statutory Template Quick-Dispatches */}
        <div className="lg:col-span-4 bg-[#0E1628] border-r border-[#223055] p-4 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#9AA5B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#2DD4BF]" />
                <span>COMMS CHANNELS</span>
              </div>

              <div className="space-y-1">
                {channels.map((ch) => {
                  const isActive = activeChannel === ch.id;
                  const count = messages.filter((m) => ch.id === 'war-room' || m.channel === ch.id).length;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setActiveChannel(ch.id);
                      }}
                      className={`w-full px-3 py-2 rounded text-left transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-[#1B2540] text-[#2DD4BF] border border-[#2DD4BF]/40 font-semibold'
                          : 'text-[#9AA5B8] hover:bg-[#131B2E] hover:text-[#E8EAED]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? 'text-[#2DD4BF]' : 'text-[#6B7A99]'}>{ch.icon}</span>
                        <span>{ch.label}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B1220] border border-[#223055] text-[#9AA5B8]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pre-formatted Statutory Templates */}
            <div>
              <div className="text-[11px] font-bold text-[#F2A93B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#F2A93B]" />
                <span>STATUTORY DISPATCH TEMPLATES</span>
              </div>
              <p className="text-[10px] text-[#9AA5B8] font-sans mb-2">
                Click any template to auto-populate regulatory fields for IR-{targetIncident?.id}:
              </p>

              <div className="space-y-1.5">
                {COMMS_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="w-full text-left p-2 rounded bg-[#131B2E] hover:bg-[#1B2540] border border-[#223055] hover:border-[#F2A93B]/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between text-[#E8EAED] group-hover:text-[#F2A93B] font-semibold text-[11px]">
                      <span>{tmpl.title}</span>
                      <ChevronRight className="w-3 h-3 text-[#6B7A99] group-hover:text-[#F2A93B]" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#9AA5B8]">
                      <span className="px-1 rounded bg-[#0B1220] text-[#2DD4BF] border border-[#223055]">
                        {tmpl.regulatoryTag}
                      </span>
                      <span>Priority: {tmpl.priority}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Operator Status Box */}
          <div className="bg-[#131B2E] border border-[#223055] p-3 rounded text-[11px]">
            <div className="text-[#9AA5B8]">DISPATCHING OFFICER:</div>
            <div className="font-bold text-[#E8EAED] flex items-center justify-between mt-0.5">
              <span>{authenticatedOperator.name}</span>
              <span className="text-[#2DD4BF]">{authenticatedOperator.badgeId}</span>
            </div>
            <div className="text-[#6B7A99] text-[10px] mt-0.5">{authenticatedOperator.role}</div>
          </div>
        </div>

        {/* Right Side: Live Messages Feed & Composer */}
        <div className="lg:col-span-8 bg-[#0B1220] p-4 flex flex-col justify-between gap-4">
          {/* Channel Header & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#223055] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#E8EAED]">
                #{activeChannel.toUpperCase()}
              </span>
              <span className="text-[11px] text-[#9AA5B8]">
                ({filteredMessages.length} transmissions)
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search transmission logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#131B2E] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] text-xs px-2.5 py-1 pl-7 rounded outline-none w-48"
              />
              <Filter className="w-3.5 h-3.5 text-[#6B7A99] absolute left-2 top-2" />
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-3 pr-1">
            {filteredMessages.length === 0 ? (
              <div className="py-12 text-center text-[#6B7A99]">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
                <p>No transmissions found matching this filter.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isCritical = msg.priority === 'CRITICAL';
                const isDirective = msg.priority === 'DIRECTIVE';
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded border transition-all ${
                      isCritical
                        ? 'bg-[#181216] border-red-900/60'
                        : isDirective
                        ? 'bg-[#161B2E] border-blue-900/60'
                        : 'bg-[#131B2E] border-[#223055]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#223055]/60 pb-1.5 mb-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            isCritical
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : isDirective
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-[#1B2540] text-[#2DD4BF]'
                          }`}
                        >
                          {msg.priority}
                        </span>

                        <span className="font-bold text-[#E8EAED]">{msg.senderName}</span>
                        <span className="text-[#6B7A99]">({msg.senderBadge})</span>

                        {msg.incidentId && (
                          <span className="px-1.5 py-0.2 rounded bg-[#0B1220] text-[#F2A93B] border border-[#223055] text-[10px]">
                            IR-{msg.incidentId}
                          </span>
                        )}

                        {msg.regulatoryTag && (
                          <span className="px-1.5 py-0.2 rounded bg-[#1B2540] text-[#2DD4BF] text-[10px]">
                            {msg.regulatoryTag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[#6B7A99] text-[10px]">
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          title="Copy message content"
                          className="p-1 hover:text-[#2DD4BF] transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#2DD4BF]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[#E8EAED] font-sans text-xs whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Broadcast Composer */}
          <form onSubmit={handleSendCustomMessage} className="bg-[#131B2E] border border-[#223055] p-3 rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-[#9AA5B8]">Priority:</span>
                <select
                  value={messagePriority}
                  onChange={(e) => setMessagePriority(e.target.value as CommsPriority)}
                  className="bg-[#0B1220] border border-[#223055] text-[#E8EAED] px-2 py-0.5 rounded outline-none"
                >
                  <option value="CRITICAL">CRITICAL · Urgent Alert</option>
                  <option value="URGENT">URGENT · Fast Action</option>
                  <option value="DIRECTIVE">DIRECTIVE · Command Order</option>
                  <option value="ROUTINE">ROUTINE · General Update</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#9AA5B8]">Tag:</span>
                <select
                  value={regulatoryTag}
                  onChange={(e) => setRegulatoryTag(e.target.value as any)}
                  className="bg-[#0B1220] border border-[#223055] text-[#E8EAED] px-2 py-0.5 rounded outline-none"
                >
                  <option value="INTERNAL-SOC">INTERNAL-SOC · Internal Team</option>
                  <option value="CBN-MANDATORY">CBN-MANDATORY · Central Bank</option>
                  <option value="NDPR-BREACH">NDPR-BREACH · Data Protection</option>
                  <option value="NIBSS-ALERT">NIBSS-ALERT · Clearing Switch</option>
                  <option value="BOARD-BRIEF">BOARD-BRIEF · Board Risk</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-[#9AA5B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLogToIncident}
                  onChange={(e) => setAutoLogToIncident(e.target.checked)}
                  className="rounded bg-[#0B1220] border-[#223055] text-[#2DD4BF] focus:ring-0"
                />
                <span>Auto-record to Incident Audit Trail</span>
              </label>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                required
                placeholder={`Dispatch message or statutory notice to #${activeChannel}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#223055] focus:border-[#2DD4BF] text-[#E8EAED] p-2.5 rounded outline-none text-xs font-sans placeholder-[#6B7A99]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#6B7A99]">
                Press Send to broadcast to active SOC war room & dispatch channels.
              </div>

              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="px-4 py-2 bg-[#2DD4BF] hover:bg-[#26b8a5] disabled:opacity-50 text-[#0B1220] font-mono font-bold text-xs rounded flex items-center gap-1.5 transition-transform active:scale-95 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>DISPATCH TRANSMISSION</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
