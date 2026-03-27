import { useState, useEffect, useMemo } from "react";
import { Instrument, AssetType, Trade } from "../types";
import { DB } from "../constants";
import { Panel, MetricTile } from "./Common";
import { Search, Plus, Zap, Calculator as CalcIcon, ClipboardList, Target, ShieldAlert, X } from "lucide-react";
import { cn } from "../lib/utils";

interface CalculatorProps {
  liveBalance: number;
  customInstruments: Instrument[];
  onAddCustomInstrument: (inst: Instrument) => void;
  onSwitchTab: (tab: string) => void;
  onSetPendingTrade: (trade: Partial<Trade>) => void;
  riskPct: string;
  winRate: string;
  onUpdateRiskPct: (rp: string) => void;
  onUpdateWinRate: (wr: string) => void;
}

export function Calculator({ 
  liveBalance, 
  customInstruments, 
  onAddCustomInstrument, 
  onSwitchTab, 
  onSetPendingTrade,
  riskPct,
  winRate,
  onUpdateRiskPct,
  onUpdateWinRate
}: CalculatorProps) {
  const [currentCat, setCurrentCat] = useState('index');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInst, setSelectedInst] = useState<Instrument>(DB.index[2]); // NQ default
  
  // Form state
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');

  // Tick Calculator state
  const [tickCalcValue, setTickCalcValue] = useState('10');

  // Custom Instrument state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newInst, setNewInst] = useState<Partial<Instrument>>({
    ticker: '',
    name: '',
    cat: 'Custom',
    type: 'futures',
    dpp: 20,
    tick: 0.25,
    dec: 2
  });

  const allInstruments = useMemo(() => {
    const builtin = Object.values(DB).flat();
    return [...builtin, ...(customInstruments || [])];
  }, [customInstruments]);

  const filteredInstruments = useMemo(() => {
    if (searchQuery) {
      return allInstruments.filter(i => 
        i.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (currentCat === 'custom') return customInstruments || [];
    return DB[currentCat] || [];
  }, [currentCat, searchQuery, allInstruments, customInstruments]);

  // Calculations
  const results = useMemo(() => {
    const balance = liveBalance;
    const rPct = parseFloat(riskPct) || 0;
    const wr = (parseFloat(winRate) || 50) / 100;
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const i = selectedInst;
    
    const riskAmt = balance * (rPct / 100);
    
    if (!entry || !sl) return null;

    const stopDist = Math.abs(entry - sl);
    const stopPct = (stopDist / entry) * 100;
    const isLong = direction === 'long';
    const hasTp = tp && ((isLong && tp > entry) || (!isLong && tp < entry));
    const tpDist = hasTp ? Math.abs(tp - entry) : 0;

    let size = 0;
    let usedRisk = riskAmt;
    let rewardAmt = 0;
    let posLabel = "";
    let riskPerUnit = 0;
    let rewardPerUnit = 0;
    let notionalValue = 0;

    if (i.type === 'futures') {
      riskPerUnit = stopDist * i.dpp;
      size = riskPerUnit > 0 ? Math.max(1, Math.floor(riskAmt / riskPerUnit)) : 1;
      usedRisk = size * riskPerUnit;
      posLabel = `${size} contract${size !== 1 ? 's' : ''}`;
      if (hasTp) {
        rewardPerUnit = tpDist * i.dpp;
        rewardAmt = size * rewardPerUnit;
      }
      notionalValue = size * entry * i.dpp;
    } else if (i.type === 'forex') {
      const pips = stopDist / i.tick;
      const tpPips = hasTp ? tpDist / i.tick : 0;
      const lots = riskAmt / (pips * (i.pipVal || 10));
      size = lots;
      posLabel = `${lots.toFixed(2)} lots`;
      riskPerUnit = pips * (i.pipVal || 10);
      if (hasTp) {
        rewardPerUnit = tpPips * (i.pipVal || 10);
        rewardAmt = lots * rewardPerUnit;
      }
      notionalValue = lots * 100000 * entry;
    } else {
      const units = riskAmt / stopDist;
      size = i.cat === 'Stocks' ? Math.floor(units) : units;
      posLabel = i.cat === 'Stocks' ? `${Math.floor(units)} shares` : `${units.toFixed(4)} units`;
      riskPerUnit = stopDist;
      if (hasTp) {
        rewardPerUnit = tpDist;
        rewardAmt = units * tpDist;
      }
      notionalValue = units * entry;
    }

    const rrr = hasTp && stopDist > 0 ? tpDist / stopDist : 0;
    const ev = (wr * rewardAmt) - ((1 - wr) * usedRisk);
    const beWR = rrr > 0 ? (1 / (1 + rrr)) * 100 : 0;

    return {
      size,
      posLabel,
      usedRisk,
      rewardAmt,
      rrr,
      ev,
      stopDist,
      stopPct,
      beWR,
      notionalValue,
      riskPerUnit,
      rewardPerUnit,
      hasTp
    };
  }, [liveBalance, riskPct, winRate, entryPrice, stopLoss, takeProfit, direction, selectedInst]);

  const formatCurrency = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleLogTrade = () => {
    if (!results) return;
    onSetPendingTrade({
      pair: selectedInst.ticker,
      dir: direction.toUpperCase() as any,
      entry: parseFloat(entryPrice),
      sl: parseFloat(stopLoss),
      tp: parseFloat(takeProfit),
      rrr: results.rrr,
      date: new Date().toISOString().split('T')[0]
    });
    onSwitchTab('journal');
  };

  const handleAddCustom = () => {
    if (!newInst.ticker || !newInst.name) return;
    onAddCustomInstrument(newInst as Instrument);
    setShowCustomModal(false);
    setNewInst({
      ticker: '',
      name: '',
      cat: 'Custom',
      type: 'futures',
      dpp: 20,
      tick: 0.25,
      dec: 2
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[268px_1fr_328px] gap-4 items-start">
      {/* LEFT: Instruments */}
      <Panel 
        title="Markets" 
        icon={<Search size={14} />} 
        iconClass="bg-[var(--sky)]/14 text-[var(--sky2)]"
        headerAction={
          <button 
            onClick={() => setShowCustomModal(true)}
            className="bg-[var(--sky)]/10 border border-[var(--sky)]/25 rounded-md text-[var(--sky2)] text-[0.68rem] font-bold px-2.5 py-1 cursor-pointer transition-all duration-150 hover:bg-[var(--sky)]/20"
          >
            + Custom
          </button>
        }
        className="h-[calc(100vh-140px)] flex flex-col overflow-hidden lg:sticky lg:top-4"
        bodyClass="flex-1 flex flex-col overflow-hidden p-0"
      >
        <div className="p-4 pb-2">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--t2)] pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search markets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[var(--ink)] border border-[var(--wire)] rounded-lg text-[var(--t0)] font-mono text-[0.76rem] outline-none focus:border-[var(--sky)]"
            />
          </div>

          <div className="flex gap-1 flex-wrap mb-2">
            {['index', 'metals', 'forex', 'crypto', 'custom'].map(cat => (
              <button 
                key={cat}
                onClick={() => { setCurrentCat(cat); setSearchQuery(''); }}
                className={cn(
                  "px-2.5 py-1 bg-[var(--ink4)] border border-[var(--wire)] text-[var(--t2)] rounded-md text-[0.68rem] font-semibold cursor-pointer transition-all duration-150 hover:text-[var(--t1)] hover:border-[var(--wire2)]",
                  currentCat === cat && !searchQuery && "bg-[var(--sky)]/12 border-[var(--sky)] text-[var(--sky2)]"
                )}
              >
                {cat === 'index' ? 'Indices' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 border-t border-[var(--wire)] scrollbar-thin">
          {currentCat === 'custom' && (
            <button 
              onClick={() => setShowCustomModal(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-b border-[var(--wire)] bg-[var(--sky)]/5 text-[var(--sky2)] text-[0.75rem] font-bold hover:bg-[var(--sky)]/10 transition-colors"
            >
              <Plus size={14} />
              Add New Custom Market
            </button>
          )}
          {filteredInstruments.length > 0 ? (
            filteredInstruments.map(inst => {
              const isActive = inst.ticker === selectedInst.ticker;
              return (
                <div 
                  key={inst.ticker + inst.cat}
                  onClick={() => setSelectedInst(inst)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-l-2 border-transparent hover:bg-white/3",
                    isActive && "bg-[var(--sky)]/7 border-l-[var(--sky)]"
                  )}
                >
                  <div className={cn("font-mono text-[0.82rem] font-bold text-[var(--t0)] min-w-[48px]", isActive && "text-[var(--sky2)]")}>
                    {inst.ticker}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.74rem] text-[var(--t1)] leading-tight font-medium">{inst.name}</div>
                    <div className="font-mono text-[0.64rem] text-[var(--t2)] mt-1">
                      ${inst.dpp}/pt · {inst.tick} tick
                    </div>
                  </div>
                  <div className="bg-[var(--ink4)] text-[var(--t2)] font-mono text-[0.62rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
                    {inst.cat}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <div className="text-[var(--t2)] text-[0.75rem] mb-1">No markets found</div>
              <div className="text-[var(--t3)] text-[0.65rem]">Try a different search term</div>
            </div>
          )}
        </div>
      </Panel>

      {/* CENTER: Calculator */}
      <div className="flex flex-col gap-4">
        <div className="bg-[var(--ink2)] border border-[var(--wire)] rounded-[var(--r2)] p-4.5 flex items-center gap-5 flex-wrap">
          <div>
            <div className="font-mono text-[1.35rem] font-bold text-[var(--t0)] tracking-tight">{selectedInst.ticker}</div>
            <div className="text-[0.78rem] text-[var(--t1)]">{selectedInst.name} · {selectedInst.cat}</div>
          </div>
          <div className="flex gap-5.5 ml-auto flex-wrap">
            <div className="flex flex-col items-end">
              <span className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest">$/Point</span>
              <span className="font-mono text-[0.84rem] font-bold text-[var(--sky2)]">${selectedInst.dpp}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest">Tick Size</span>
              <span className="font-mono text-[0.84rem] font-bold text-[var(--sky2)]">{selectedInst.tick}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest">Type</span>
              <span className="font-mono text-[0.84rem] font-bold text-[var(--sky2)] capitalize">{selectedInst.type}</span>
            </div>
          </div>
        </div>

        <Panel title="Account & Risk" icon={<CalcIcon size={14} />} iconClass="bg-[var(--sky)]/14 text-[var(--sky2)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1.5">
                Account Balance <span className="text-[var(--sky2)] text-[0.6rem]">AUTO</span>
              </div>
              <div className="relative iw">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
                <input type="text" value={liveBalance.toLocaleString()} readOnly className="pl-6 bg-[var(--sky)]/4 border-[var(--sky)]/20 text-[var(--sky2)] cursor-default" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--dn)]" /> Risk Per Trade
              </div>
              <div className="relative iw">
                <input type="text" value={riskPct} onChange={(e) => onUpdateRiskPct(e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">%</span>
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {['0.5', '1', '1.5', '2', '3'].map(v => (
                  <button 
                    key={v}
                    onClick={() => onUpdateRiskPct(v)}
                    className={cn(
                      "px-2.5 py-1 bg-[var(--ink4)] border border-[var(--wire)] text-[var(--t2)] rounded-md font-mono text-[0.7rem] font-semibold cursor-pointer transition-all duration-150 hover:border-[var(--sky)] hover:text-[var(--sky2)]",
                      riskPct === v && "border-[var(--sky)] text-[var(--sky2)] bg-[var(--sky)]/10"
                    )}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--sky)]" /> Entry Price
              </div>
              <div className="relative iw">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
                <input type="text" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="pl-6" placeholder="0.00" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--dn)]" /> Stop Loss
              </div>
              <div className="relative iw">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
                <input type="text" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="pl-6" placeholder="0.00" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--up)]" /> Take Profit
              </div>
              <div className="relative iw">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
                <input type="text" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="pl-6" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Direction</div>
              <div className="iw">
                <select value={direction} onChange={(e) => setDirection(e.target.value as any)}>
                  <option value="long">▲ Long</option>
                  <option value="short">▼ Short</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Win Rate</div>
              <div className="relative iw">
                <input type="text" value={winRate} onChange={(e) => onUpdateWinRate(e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="calc-btn flex-1" onClick={() => {}}>
              <Zap size={16} /> Calculate
            </button>
            {results && (
              <button 
                onClick={handleLogTrade}
                className="bg-[var(--up)]/10 border border-[var(--up)]/30 text-[var(--up)] rounded-xl px-5 font-bold text-[0.8rem] transition-all hover:bg-[var(--up)]/20"
              >
                Log Trade
              </button>
            )}
          </div>
        </Panel>

        <Panel title="Pre-Trade Breakdown" icon={<ClipboardList size={14} />} iconClass="bg-[var(--up)]/12 text-[var(--up)]" subtitle={selectedInst.ticker + " · " + selectedInst.cat}>
          <div className="grid grid-cols-2 gap-0.5 bg-[var(--wire)] rounded-xl overflow-hidden mb-3">
            <MetricTile label="Contracts / Size" value={results ? results.size.toString() : "—"} subValue={results ? results.posLabel : "enter entry & SL"} variant="sky" />
            <MetricTile label="Risk Amount" value={results ? formatCurrency(results.usedRisk) : "—"} subValue={results ? `${riskPct}% of account` : "—"} variant="dn" />
            <MetricTile label="Reward Amount" value={results?.hasTp ? formatCurrency(results.rewardAmt) : "—"} subValue={results?.hasTp ? `${(parseFloat(riskPct) * results.rrr).toFixed(2)}% of account` : "enter TP"} variant="up" />
            <MetricTile label="Risk : Reward" value={results?.hasTp ? `1:${results.rrr.toFixed(2)}` : "—"} subValue={results?.hasTp ? (results.rrr >= 2 ? "✅ Favorable" : "⚠️ Moderate") : "—"} variant="gold" />
            <MetricTile label="Expected Value" value={results?.hasTp ? (results.ev >= 0 ? "+" : "") + formatCurrency(results.ev) : "—"} subValue={results?.hasTp ? `Edge/R: ${((results.ev / results.usedRisk)).toFixed(3)}` : "—"} variant="violet" />
            <MetricTile label="Stop Distance" value={results ? `${results.stopPct.toFixed(2)}%` : "—"} subValue={results ? `${results.stopDist.toFixed(selectedInst.dec || 2)} pts` : "—"} variant="teal" />
          </div>

          <div className="flex flex-col gap-px">
            <div className="flex items-center justify-between p-2 px-3 bg-[var(--ink3)] rounded-t">
              <span className="text-[0.7rem] text-[var(--t1)] font-medium">SL distance (points/pips)</span>
              <span className="font-mono text-[0.78rem] font-bold text-[var(--t0)]">{results ? results.stopDist.toFixed(selectedInst.dec || 2) + " points" : "—"}</span>
            </div>
            <div className="flex items-center justify-between p-2 px-3 bg-[var(--ink3)]">
              <span className="text-[0.7rem] text-[var(--t1)] font-medium">Dollar risk per contract/lot</span>
              <span className="font-mono text-[0.78rem] font-bold text-[var(--t0)]">{results ? formatCurrency(results.riskPerUnit) + " / unit" : "—"}</span>
            </div>
            <div className="flex items-center justify-between p-2 px-3 bg-[var(--ink3)]">
              <span className="text-[0.7rem] text-[var(--t1)] font-medium">Notional position value</span>
              <span className="font-mono text-[0.78rem] font-bold text-[var(--t0)]">{results ? formatCurrency(results.notionalValue) : "—"}</span>
            </div>
            <div className="flex items-center justify-between p-2 px-3 bg-[var(--ink3)] rounded-b">
              <span className="text-[0.7rem] text-[var(--t1)] font-medium">Break-even win rate</span>
              <span className="font-mono text-[0.78rem] font-bold text-[var(--t0)]">{results?.hasTp ? results.beWR.toFixed(1) + "%" : "—"}</span>
            </div>
          </div>

          {results && (
            <div className={cn(
              "p-3 px-4 rounded-lg border-l-3 mt-3 text-[0.78rem] leading-relaxed font-medium",
              results.hasTp ? (results.ev > 0 ? "bg-[var(--up)]/5 border-[var(--up)] text-[var(--up)]" : "bg-[var(--dn)]/5 border-[var(--dn)] text-[var(--dn2)]") : "bg-[var(--gold)]/5 border-[var(--gold)] text-[var(--gold2)]"
            )}>
              {!results.hasTp ? (
                <>⚠️ <strong>Set Take Profit</strong> — Enter a TP to see full analysis.</>
              ) : results.ev > 0 ? (
                <>✅ <strong>Positive Edge</strong> — EV {formatCurrency(results.ev)}/trade. Profitable at {winRate}% win rate.</>
              ) : (
                <>❌ <strong>Negative Edge</strong> — EV {formatCurrency(results.ev)}/trade. This setup loses money long-term.</>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* RIGHT: Analysis */}
      <div className="flex flex-col gap-4">
        <Panel title="Tick Calculator" icon={<Target size={14} />} iconClass="bg-[var(--teal)]/12 text-[var(--teal)]">
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Ticks / Points to calculate</div>
            <div className="iw">
              <input 
                type="text" 
                value={tickCalcValue} 
                onChange={(e) => setTickCalcValue(e.target.value)}
                className="font-mono" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 5, 10].map(c => (
              <div key={c} className="bg-[var(--ink)] border border-[var(--wire)] rounded-lg p-3 text-center">
                <div className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest mb-1">{c} Contract{c !== 1 ? 's' : ''}</div>
                <div className="font-mono text-[1.05rem] font-bold text-[var(--up)]">
                  {formatCurrency((parseFloat(tickCalcValue || '0') * (selectedInst.dpt || (selectedInst.dpp * selectedInst.tick)) * c))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Scenario Analysis" icon={<ShieldAlert size={14} />} iconClass="bg-[var(--gold)]/12 text-[var(--gold)]" subtitle="next 10 trades">
          <div className="-mx-4 -mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Scenario</th>
                  <th className="p-2 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">W/L</th>
                  <th className="p-2 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { n: '🏆 Best Case', w: 10, l: 0 },
                  { n: '🔥 Strong Run', w: 8, l: 2 },
                  { n: '📊 Expected', w: Math.round(parseFloat(winRate) / 10), l: 10 - Math.round(parseFloat(winRate) / 10), hl: true },
                  { n: '📉 Rough Run', w: 3, l: 7 },
                  { n: '🚫 Worst Case', w: 0, l: 10 },
                ].map((s, idx) => {
                  const pnl = results ? (s.w * results.rewardAmt) - (s.l * results.usedRisk) : 0;
                  return (
                    <tr key={idx} className={cn("hover:bg-white/2 transition-colors", s.hl && "bg-[var(--sky)]/5")}>
                      <td className="p-2 px-4 text-[0.75rem] text-[var(--t1)] font-medium">{s.n}</td>
                      <td className="p-2 px-4 font-mono text-[0.76rem] text-[var(--up)]">{s.w}/{s.l}</td>
                      <td className={cn("p-2 px-4 font-mono text-[0.76rem] font-bold", pnl >= 0 ? "text-[var(--up)]" : "text-[var(--dn2)]")}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      {/* Custom Instrument Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade">
          <div className="bg-[var(--ink2)] border border-[var(--wire)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-pop">
            <div className="p-5 border-b border-[var(--wire)] bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--sky)]/10 flex items-center justify-center text-[var(--sky2)] border border-[var(--sky)]/20">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--t0)] text-[1.05rem]">Add Custom Market</h3>
                  <p className="text-[0.68rem] text-[var(--t2)]">Define a new trading instrument for your calculator</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCustomModal(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--t2)] hover:text-[var(--t0)] hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Templates */}
              <div>
                <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest mb-2 block">Quick Templates</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Futures', type: 'futures', dpp: 20, tick: 0.25, dec: 2 },
                    { label: 'Forex', type: 'forex', dpp: 1, tick: 0.0001, dec: 4 },
                    { label: 'Spot/Crypto', type: 'spot', dpp: 1, tick: 0.01, dec: 2 }
                  ].map(t => (
                    <button
                      key={t.label}
                      onClick={() => setNewInst({ ...newInst, type: t.type as any, dpp: t.dpp, tick: t.tick, dec: t.dec })}
                      className="px-3 py-2 bg-[var(--ink)] border border-[var(--wire)] rounded-lg text-[0.7rem] text-[var(--t1)] hover:border-[var(--sky)] hover:text-[var(--sky2)] transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Ticker Symbol</label>
                  <input 
                    type="text" 
                    value={newInst.ticker} 
                    onChange={(e) => setNewInst({...newInst, ticker: e.target.value.toUpperCase()})}
                    placeholder="e.g. NQ, EURUSD"
                    className="iw"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={newInst.name} 
                    onChange={(e) => setNewInst({...newInst, name: e.target.value})}
                    placeholder="e.g. Nasdaq 100"
                    className="iw"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Asset Type</label>
                  <select 
                    value={newInst.type} 
                    onChange={(e) => setNewInst({...newInst, type: e.target.value as any})}
                    className="iw"
                  >
                    <option value="futures">Futures (Contract based)</option>
                    <option value="forex">Forex (Lot based)</option>
                    <option value="spot">Spot / Stocks (Unit based)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Category</label>
                  <input 
                    type="text" 
                    value={newInst.cat} 
                    onChange={(e) => setNewInst({...newInst, cat: e.target.value})}
                    placeholder="e.g. Indices, Crypto"
                    className="iw"
                  />
                </div>
              </div>

              <div className="bg-[var(--ink)] border border-[var(--wire)] rounded-xl p-4 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1">
                    Value / Pt
                    <div className="group relative">
                      <div className="w-3 h-3 rounded-full border border-[var(--t3)] flex items-center justify-center text-[0.5rem] cursor-help">?</div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--ink4)] border border-[var(--wire)] rounded text-[0.6rem] text-[var(--t1)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                        Dollar value of 1 full point move. (e.g. $20 for NQ, $1 for Forex)
                      </div>
                    </div>
                  </label>
                  <input 
                    type="number" 
                    value={newInst.dpp} 
                    onChange={(e) => setNewInst({...newInst, dpp: parseFloat(e.target.value)})}
                    className="iw"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest flex items-center gap-1">
                    Tick Size
                    <div className="group relative">
                      <div className="w-3 h-3 rounded-full border border-[var(--t3)] flex items-center justify-center text-[0.5rem] cursor-help">?</div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--ink4)] border border-[var(--wire)] rounded text-[0.6rem] text-[var(--t1)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                        Minimum price increment. (e.g. 0.25 for ES, 0.0001 for Forex)
                      </div>
                    </div>
                  </label>
                  <input 
                    type="number" 
                    step="0.00001"
                    value={newInst.tick} 
                    onChange={(e) => setNewInst({...newInst, tick: parseFloat(e.target.value)})}
                    className="iw"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Decimals</label>
                  <input 
                    type="number" 
                    value={newInst.dec} 
                    onChange={(e) => setNewInst({...newInst, dec: parseInt(e.target.value)})}
                    className="iw"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 px-5 py-3 bg-[var(--ink3)] border border-[var(--wire)] text-[var(--t1)] font-bold rounded-xl hover:bg-[var(--ink4)] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCustom}
                  className="flex-[2] bg-[var(--sky)] text-white font-bold py-3 rounded-xl transition-all hover:bg-[var(--sky2)] shadow-lg shadow-[var(--sky)]/20 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Save Market
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
