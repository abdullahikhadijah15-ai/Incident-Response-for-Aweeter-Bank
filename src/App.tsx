/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Incident, IncidentStatus, SOCOperator, CommsMessage } from './types';
import {
  loadIncidents,
  getIncidentById,
  toggleIncidentStep,
  updateIncidentStatus,
  addIncidentLogEntry,
  resetDemoData,
} from './utils/storage';
import { INITIAL_COMMS } from './data/commsData';
import { Navbar } from './components/Navbar';
import { AuthLandingPage } from './components/AuthLandingPage';
import { DashboardView } from './components/DashboardView';
import { NewIncidentView } from './components/NewIncidentView';
import { IncidentDetailView } from './components/IncidentDetailView';
import { CommunicationsCenter } from './components/CommunicationsCenter';
import { ReportCenterModal } from './components/ReportCenterModal';
import { playSuccessChime, playRadioTransmission, playAlertSiren } from './utils/audio';

type ViewMode = 'dashboard' | 'new' | 'detail' | 'comms';

const AUTH_STORAGE_KEY = 'aweeter_soc_operator_v1';
const COMMS_STORAGE_KEY = 'aweeter_soc_comms_v1';

export default function App() {
  const [authenticatedOperator, setAuthenticatedOperator] = useState<SOCOperator | null>(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [commsMessages, setCommsMessages] = useState<CommsMessage[]>(() => {
    try {
      const savedComms = localStorage.getItem(COMMS_STORAGE_KEY);
      if (savedComms) {
        return JSON.parse(savedComms);
      }
    } catch {
      // ignore
    }
    return INITIAL_COMMS;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [offsetHours, setOffsetHours] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist authenticated operator
  useEffect(() => {
    try {
      if (authenticatedOperator) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedOperator));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [authenticatedOperator]);

  // Persist comms messages
  useEffect(() => {
    try {
      localStorage.setItem(COMMS_STORAGE_KEY, JSON.stringify(commsMessages));
    } catch {
      // ignore
    }
  }, [commsMessages]);

  // Load incidents from storage
  const refreshIncidents = () => {
    const data = loadIncidents();
    setIncidents(data);
  };

  useEffect(() => {
    refreshIncidents();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAuthenticate = (operator: SOCOperator) => {
    setAuthenticatedOperator(operator);
    setViewMode('dashboard');
    showToast(`Officer authenticated: ${operator.callsign} [${operator.badgeId}]`);
  };

  const handleLogout = () => {
    setAuthenticatedOperator(null);
    setViewMode('dashboard');
    setSelectedIncidentId(null);
    showToast('Signed out of SOC Console.');
  };

  const handleSelectIncident = (id: number) => {
    setSelectedIncidentId(id);
    setViewMode('detail');
  };

  const handleNavigateHome = () => {
    setViewMode('dashboard');
    setSelectedIncidentId(null);
    refreshIncidents();
  };

  const handleNavigateNew = () => {
    setViewMode('new');
    setSelectedIncidentId(null);
  };

  const handleNavigateComms = (targetIncidentId?: number) => {
    if (targetIncidentId) {
      setSelectedIncidentId(targetIncidentId);
    }
    setViewMode('comms');
  };

  const handleIncidentCreated = (newId: number) => {
    refreshIncidents();
    setSelectedIncidentId(newId);
    setViewMode('detail');
    showToast(`Incident IR-${newId} initialized and dispatched.`);
  };

  const handleResetData = () => {
    if (window.confirm('Reset incident queue & comms log to baseline Aweeter Bank demo data?')) {
      const reset = resetDemoData();
      setIncidents(reset);
      setCommsMessages(INITIAL_COMMS);
      setOffsetHours(0);
      if (selectedIncidentId) {
        const found = reset.find((i) => i.id === selectedIncidentId);
        if (!found) {
          setViewMode('dashboard');
          setSelectedIncidentId(null);
        }
      }
      showToast('Demo data queue and comms log reset to baseline.');
    }
  };

  const handleToggleStep = (stepId: string, author?: string) => {
    if (!selectedIncidentId) return;
    const authorName = author || authenticatedOperator?.name || 'SOC Analyst';
    toggleIncidentStep(selectedIncidentId, stepId, authorName);
    refreshIncidents();
  };

  const handleUpdateStatus = (newStatus: IncidentStatus, author?: string) => {
    if (!selectedIncidentId) return;
    const authorName = author || authenticatedOperator?.name || 'SOC Analyst';
    updateIncidentStatus(selectedIncidentId, newStatus, authorName);
    refreshIncidents();
    showToast(`Incident IR-${selectedIncidentId} status transitioned to ${newStatus.toUpperCase()}.`);
  };

  const handleAddLogEntry = (note: string, author: string) => {
    if (!selectedIncidentId) return;
    addIncidentLogEntry(selectedIncidentId, note, author);
    refreshIncidents();
    showToast('Forensic log entry appended to audit trail.');
  };

  const handleSendCommsMessage = (newMsgData: Omit<CommsMessage, 'id' | 'timestamp'>) => {
    const newMsg: CommsMessage = {
      ...newMsgData,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setCommsMessages((prev) => [newMsg, ...prev]);
    showToast(`Broadcast transmission dispatched to #${newMsg.channel.toUpperCase()}`);
  };

  const handleAddCommsLogToIncident = (incidentId: number, note: string, author: string) => {
    addIncidentLogEntry(incidentId, note, author);
    refreshIncidents();
  };

  // If not authenticated, present the Landing Page
  if (!authenticatedOperator) {
    return (
      <AuthLandingPage
        onAuthenticate={handleAuthenticate}
        activeIncidents={incidents}
      />
    );
  }

  const currentIncident = selectedIncidentId ? getIncidentById(selectedIncidentId) : undefined;

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E8EAED] flex flex-col font-sans selection:bg-[#F2A93B] selection:text-[#0B1220]">
      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#131B2E] border border-[#F2A93B] px-4 py-2.5 rounded shadow-2xl flex items-center gap-2.5 text-xs font-mono text-[#E8EAED] animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar
        onNavigateHome={handleNavigateHome}
        onNavigateNew={handleNavigateNew}
        onNavigateComms={() => handleNavigateComms()}
        onOpenReportCenter={() => setIsReportModalOpen(false)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        currentView={viewMode}
        authenticatedOperator={authenticatedOperator}
        offsetHours={offsetHours}
        commsCount={commsMessages.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {viewMode === 'dashboard' && (
          <DashboardView
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onNavigateNew={handleNavigateNew}
            onNavigateComms={() => handleNavigateComms()}
            onOpenReportCenter={() => setIsReportModalOpen(true)}
            offsetHours={offsetHours}
            onSetOffsetHours={setOffsetHours}
            onResetTime={() => setOffsetHours(0)}
            recentComms={commsMessages}
          />
        )}

        {viewMode === 'comms' && (
          <CommunicationsCenter
            messages={commsMessages}
            incidents={incidents}
            currentIncidentId={selectedIncidentId}
            authenticatedOperator={authenticatedOperator}
            onSendMessage={handleSendCommsMessage}
            onAddLogToIncident={handleAddCommsLogToIncident}
            onClose={handleNavigateHome}
          />
        )}

        {viewMode === 'new' && (
          <NewIncidentView
            onIncidentCreated={handleIncidentCreated}
            onCancel={handleNavigateHome}
          />
        )}

        {viewMode === 'detail' && currentIncident && (
          <IncidentDetailView
            incident={currentIncident}
            onBack={handleNavigateHome}
            onToggleStep={handleToggleStep}
            onUpdateStatus={handleUpdateStatus}
            onAddLogEntry={handleAddLogEntry}
            onOpenReportCenter={() => setIsReportModalOpen(true)}
            onNavigateComms={(incId) => handleNavigateComms(incId)}
            authenticatedOperator={authenticatedOperator}
            offsetHours={offsetHours}
            onSetOffsetHours={setOffsetHours}
            onResetTime={() => setOffsetHours(0)}
          />
        )}

        {viewMode === 'detail' && !currentIncident && (
          <div className="p-12 text-center text-[#9AA5B8] font-mono">
            <p>Incident not found or has been removed.</p>
            <button
              onClick={handleNavigateHome}
              className="mt-4 px-4 py-2 bg-[#F2A93B] text-[#0B1220] font-bold text-xs rounded"
            >
              Return to Queue
            </button>
          </div>
        )}
      </main>

      {/* Report & Export Center Modal */}
      <ReportCenterModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        incidents={incidents}
        currentIncident={currentIncident}
        offsetHours={offsetHours}
      />

      {/* Footer */}
      <footer className="border-t border-[#223055] py-4 px-6 text-center text-xs font-mono text-[#6B7A99] bg-[#0B1220]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>◈ AWEETER/IR · INCIDENT RESPONSE & REGULATORY COMMUNICATIONS PLATFORM</span>
          <span className="text-[11px]">
            ACTIVE OPERATOR: {authenticatedOperator.name} ({authenticatedOperator.badgeId}) · {authenticatedOperator.clearanceLevel}
          </span>
        </div>
      </footer>
    </div>
  );
}
