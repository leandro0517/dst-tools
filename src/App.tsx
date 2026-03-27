/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { useTrading } from './hooks/useTrading';
import { TopBar, BalanceBar } from './components/Layout';
import { Calculator } from './components/Calculator';
import { DailyTarget } from './components/DailyTarget';
import { Journal } from './components/Journal';
import { Analytics } from './components/Analytics';
import { Reflections } from './components/Reflections';
import { Trade } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('calc');
  const [pendingTrade, setPendingTrade] = useState<Partial<Trade> | null>(null);
  const {
    meta,
    currentProfile,
    profileData,
    realizedPnl,
    liveBalance,
    switchProfile,
    createProfile,
    deleteProfile,
    addTrade,
    deleteTrade,
    clearAllTrades,
    updateInitialBalance,
    addCustomInstrument,
    addStrategy,
    deleteStrategy,
    exportData,
    importData,
    updateWinRate,
    updateRiskPct,
    exportCSV,
    importCSV,
    addReflection,
    deleteReflection,
    updateReflection,
    addLesson,
    deleteLesson,
    toggleLesson,
    updateDailyIntention
  } = useTrading();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            importData(data);
          } catch (err) {
            alert("Invalid JSON file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        meta={meta}
        currentProfile={currentProfile}
        switchProfile={switchProfile}
        createProfile={createProfile}
        deleteProfile={deleteProfile}
        liveBalance={liveBalance}
        tradeCount={profileData.trades.length}
        realizedPnl={realizedPnl}
        onExport={exportData}
        onImport={handleImport}
      />
      
      <BalanceBar 
        initialBalance={profileData.initialBalance}
        realizedPnl={realizedPnl}
        liveBalance={liveBalance}
        tradeCount={profileData.trades.length}
        currentProfile={currentProfile}
        onUpdateInitialBalance={updateInitialBalance}
      />

      <main className="flex-1 p-5 md:p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'calc' && (
          <div className="animate-fadeUp">
            <Calculator 
              liveBalance={liveBalance} 
              customInstruments={profileData.customInstruments}
              onAddCustomInstrument={addCustomInstrument}
              onSwitchTab={setActiveTab}
              onSetPendingTrade={setPendingTrade}
              riskPct={profileData.riskPct}
              winRate={profileData.winRate}
              onUpdateRiskPct={updateRiskPct}
              onUpdateWinRate={updateWinRate}
            />
          </div>
        )}
        
        {activeTab === 'daily' && (
          <div className="animate-fadeUp">
            <DailyTarget 
              liveBalance={liveBalance} 
              winRate={profileData.winRate}
              riskPct={profileData.riskPct}
              onUpdateWinRate={updateWinRate}
              onUpdateRiskPct={updateRiskPct}
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="animate-fadeUp">
            <Journal 
              trades={profileData.trades}
              onAddTrade={addTrade}
              onDeleteTrade={deleteTrade}
              onClearAll={clearAllTrades}
              pendingTrade={pendingTrade}
              onClearPending={() => setPendingTrade(null)}
              strategies={profileData.strategies}
              onAddStrategy={addStrategy}
              onDeleteStrategy={deleteStrategy}
              onExportCSV={exportCSV}
              onImportCSV={importCSV}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fadeUp">
            <Analytics 
              trades={profileData.trades} 
              onNavigateToJournal={() => setActiveTab('journal')}
            />
          </div>
        )}

        {activeTab === 'reflections' && (
          <div className="animate-fadeUp">
            <Reflections 
              reflections={profileData.reflections}
              lessons={profileData.lessons}
              dailyIntention={profileData.dailyIntention || ''}
              onAddReflection={addReflection}
              onDeleteReflection={deleteReflection}
              onUpdateReflection={updateReflection}
              onAddLesson={addLesson}
              onDeleteLesson={deleteLesson}
              onToggleLesson={toggleLesson}
              onUpdateDailyIntention={updateDailyIntention}
            />
          </div>
        )}
      </main>
    </div>
  );
}
