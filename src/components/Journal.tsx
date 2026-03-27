import React, { useState, useMemo, ChangeEvent, useEffect } from "react";
import { Trade, TradeResult, TradeDirection } from "../types";
import { Panel } from "./Common";
import { BookOpen, Calendar as CalendarIcon, List, Download, Upload, Trash2, Plus, X, Image as ImageIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

import { TradeForm } from "./TradeForm";

interface JournalProps {
  trades: Trade[];
  onAddTrade: (trade: Omit<Trade, 'id'>) => void;
  onDeleteTrade: (id: number) => void;
  onClearAll: () => void;
  pendingTrade?: Partial<Trade> | null;
  onClearPending?: () => void;
  strategies: string[];
  onAddStrategy: (strategy: string) => void;
  onDeleteStrategy: (strategy: string) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
}

export function Journal({ 
  trades, 
  onAddTrade, 
  onDeleteTrade, 
  onClearAll, 
  pendingTrade, 
  onClearPending, 
  strategies, 
  onAddStrategy, 
  onDeleteStrategy,
  onExportCSV,
  onImportCSV
}: JournalProps) {
  const [mode, setMode] = useState<'list' | 'calendar'>('calendar');
  const [lightbox, setLightbox] = useState<{ imgs: string[], idx: number } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center bg-[var(--ink2)] border border-[var(--wire)] rounded-[var(--r2)] overflow-hidden">
        <button 
          onClick={() => setMode('list')}
          className={cn(
            "flex-1 py-2.5 px-4 bg-none border-none text-[var(--t2)] font-semibold cursor-pointer transition-all duration-180 flex items-center justify-center gap-2 border-r border-[var(--wire)]",
            mode === 'list' && "bg-[var(--sky)]/10 text-[var(--sky2)]"
          )}
        >
          <List size={16} /> Trade Log
        </button>
        <button 
          onClick={() => setMode('calendar')}
          className={cn(
            "flex-1 py-2.5 px-4 bg-none border-none text-[var(--t2)] font-semibold cursor-pointer transition-all duration-180 flex items-center justify-center gap-2",
            mode === 'calendar' && "bg-[var(--sky)]/10 text-[var(--sky2)]"
          )}
        >
          <CalendarIcon size={16} /> P&L Calendar
        </button>
      </div>

      {mode === 'list' ? (
        <JournalList 
          trades={trades} 
          onAddTrade={onAddTrade} 
          onDeleteTrade={onDeleteTrade} 
          onClearAll={onClearAll}
          onOpenLightbox={(imgs, idx) => setLightbox({ imgs, idx })}
          pendingTrade={pendingTrade}
          onClearPending={onClearPending}
          strategies={strategies}
          onAddStrategy={onAddStrategy}
          onDeleteStrategy={onDeleteStrategy}
          onExportCSV={onExportCSV}
          onImportCSV={onImportCSV}
        />
      ) : (
        <JournalCalendar 
          trades={trades}
          onAddTrade={onAddTrade}
          strategies={strategies}
          onAddStrategy={onAddStrategy}
          onDeleteStrategy={onDeleteStrategy}
          onOpenLightbox={(imgs, idx) => setLightbox({ imgs, idx })}
          pendingTrade={pendingTrade}
          onClearPending={onClearPending}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-9999 bg-black/92 flex items-center justify-center backdrop-blur-md animate-fadeUp" onClick={() => setLightbox(null)}>
          <div className="relative max-w-[92vw] flex flex-col items-center gap-2.5" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-3.5 -right-3.5 w-8.5 h-8.5 rounded-full bg-[var(--dn)] border-2.5 border-black/60 text-white flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110">
              <X size={16} />
            </button>
            <img src={lightbox.imgs[lightbox.idx]} className="max-w-[88vw] max-h-[80vh] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] object-contain" />
            
            {lightbox.imgs.length > 1 && (
              <div className="flex items-center gap-4 mt-2">
                <button 
                  disabled={lightbox.idx === 0}
                  onClick={() => setLightbox({ ...lightbox, idx: lightbox.idx - 1 })}
                  className="w-10 h-10 rounded-full bg-white/8 border border-[var(--wire2)] text-[var(--t1)] flex items-center justify-center cursor-pointer disabled:opacity-20 hover:bg-[var(--sky)]/18 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-mono text-[0.78rem] text-[var(--t2)] min-w-[52px] text-center">{lightbox.idx + 1} / {lightbox.imgs.length}</span>
                <button 
                  disabled={lightbox.idx === lightbox.imgs.length - 1}
                  onClick={() => setLightbox({ ...lightbox, idx: lightbox.idx + 1 })}
                  className="w-10 h-10 rounded-full bg-white/8 border border-[var(--wire2)] text-[var(--t1)] flex items-center justify-center cursor-pointer disabled:opacity-20 hover:bg-[var(--sky)]/18 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function JournalList({ 
  trades, 
  onAddTrade, 
  onDeleteTrade, 
  onClearAll, 
  onOpenLightbox, 
  pendingTrade, 
  onClearPending, 
  strategies, 
  onAddStrategy,
  onDeleteStrategy,
  onExportCSV,
  onImportCSV
}: { 
  trades: Trade[], 
  onAddTrade: (trade: Omit<Trade, 'id'>) => void, 
  onDeleteTrade: (id: number) => void, 
  onClearAll: () => void, 
  onOpenLightbox: (imgs: string[], idx: number) => void,
  pendingTrade?: Partial<Trade> | null,
  onClearPending?: () => void,
  strategies: string[],
  onAddStrategy: (strategy: string) => void,
  onDeleteStrategy: (strategy: string) => void,
  onExportCSV: () => void,
  onImportCSV: (file: File) => void
}) {
  const [filterStrategy, setFilterStrategy] = useState<string>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredTrades = useMemo(() => {
    if (filterStrategy === "ALL") return trades;
    return trades.filter(t => (t.strategy || "") === (filterStrategy === "NONE" ? "" : filterStrategy));
  }, [trades, filterStrategy]);

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (n >= 0 ? '+$' : '-$') + formatted;
  };

  let cumulativePnl = 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel 
        title="Trade Journal" 
        icon={<BookOpen size={14} />} 
        iconClass="bg-[var(--violet)]/12 text-[var(--violet2)]"
        headerAction={
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 mr-2 relative">
              <span className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">Filter:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 p-1 px-2 bg-[var(--ink4)] border border-[var(--wire)] rounded text-[var(--t1)] text-[0.7rem] outline-none hover:border-[var(--sky)] min-w-[120px] justify-between"
                >
                  <span className="truncate">{filterStrategy === 'ALL' ? 'All Strategies' : filterStrategy === 'NONE' ? 'No Strategy' : filterStrategy}</span>
                  <ChevronDown size={10} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                </button>
                
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-[var(--ink2)] border border-[var(--wire2)] rounded-md shadow-xl z-50 overflow-hidden animate-fadeUp">
                      <button 
                        onClick={() => { setFilterStrategy('ALL'); setIsFilterOpen(false); }}
                        className={cn("w-full text-left px-3 py-2 text-[0.72rem] hover:bg-white/5 transition-colors", filterStrategy === 'ALL' ? "text-[var(--sky2)] font-bold" : "text-[var(--t1)]")}
                      >
                        All Strategies
                      </button>
                      <button 
                        onClick={() => { setFilterStrategy('NONE'); setIsFilterOpen(false); }}
                        className={cn("w-full text-left px-3 py-2 text-[0.72rem] hover:bg-white/5 transition-colors", filterStrategy === 'NONE' ? "text-[var(--sky2)] font-bold" : "text-[var(--t1)]")}
                      >
                        No Strategy
                      </button>
                      <div className="h-px bg-[var(--wire)] mx-2 my-1" />
                      {strategies?.map(s => (
                        <div key={s} className="group flex items-center justify-between hover:bg-white/5 transition-colors">
                          <button 
                            onClick={() => { setFilterStrategy(s); setIsFilterOpen(false); }}
                            className={cn("flex-1 text-left px-3 py-2 text-[0.72rem] truncate", filterStrategy === s ? "text-[var(--sky2)] font-bold" : "text-[var(--t1)]")}
                          >
                            {s}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteStrategy(s); if (filterStrategy === s) setFilterStrategy('ALL'); }}
                            className="p-1 px-2 text-[var(--t3)] hover:text-[var(--dn)] transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Strategy"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportCSV(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-transparent border border-[var(--wire)] rounded-md text-[var(--t1)] text-[0.77rem] font-semibold cursor-pointer transition-all duration-300 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
            >
              <Upload size={14} className="inline mr-1" /> Import CSV
            </button>
            <button 
              onClick={onExportCSV}
              className="px-3 py-1.5 bg-transparent border border-[var(--wire)] rounded-md text-[var(--t1)] text-[0.77rem] font-semibold cursor-pointer transition-all duration-300 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
            >
              <Download size={14} className="inline mr-1" /> Export CSV
            </button>
            <button onClick={onClearAll} className="px-3 py-1.5 bg-transparent border border-[var(--wire)] rounded-md text-[var(--t1)] text-[0.77rem] font-semibold cursor-pointer transition-all duration-300 hover:bg-[var(--dn)]/10 hover:text-[var(--dn)]">
              <Trash2 size={14} className="inline mr-1" /> Clear All
            </button>
          </div>
        }
      >
        <TradeForm 
          onAddTrade={onAddTrade}
          strategies={strategies}
          onAddStrategy={onAddStrategy}
          onDeleteStrategy={onDeleteStrategy}
          pendingTrade={pendingTrade}
          onClearPending={onClearPending}
        />

        <div className="overflow-x-auto -mx-4 -mb-4 mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--ink2)]">
                {["#", "Date", "Pair", "Dir", "Strategy", "Entry", "SL", "TP", "RRR", "Result", "P&L", "Cum P&L", "Chart", "Notes", ""].map(h => (
                  <th key={h} className="p-2.5 px-3 text-left text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-10 text-center text-[var(--t2)]">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
                    <p>{filterStrategy === "ALL" ? "No trades yet. Log your first trade above." : "No trades found for this strategy."}</p>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t, i) => {
                  cumulativePnl += t.pnl;
                  return (
                    <tr key={t.id} className="hover:bg-white/1 transition-colors group">
                      <td className="p-2.5 px-3 text-[var(--t2)] font-mono text-[0.78rem]">{i + 1}</td>
                      <td className="p-2.5 px-3 text-[var(--t1)] text-[0.74rem] whitespace-nowrap">{t.date}</td>
                      <td className="p-2.5 px-3 font-bold text-[var(--t0)] text-[0.78rem]">{t.pair}</td>
                      <td className="p-2.5 px-3">
                        <span className={cn("font-bold text-[0.74rem]", t.dir === 'LONG' ? "text-[var(--up)]" : "text-[var(--dn2)]")}>
                          {t.dir === 'LONG' ? '▲' : '▼'} {t.dir}
                        </span>
                      </td>
                      <td className="p-2.5 px-3">
                        <span className="text-[0.72rem] text-[var(--violet2)] font-semibold bg-[var(--violet)]/10 px-1.5 py-0.5 rounded">
                          {t.strategy || '—'}
                        </span>
                      </td>
                      <td className="p-2.5 px-3 font-mono text-[0.78rem]">{t.entry || '—'}</td>
                      <td className="p-2.5 px-3 font-mono text-[0.78rem]">{t.sl || '—'}</td>
                      <td className="p-2.5 px-3 font-mono text-[0.78rem]">{t.tp || '—'}</td>
                      <td className="p-2.5 px-3 font-mono text-[0.78rem] text-[var(--teal2)]">{t.rrr ? t.rrr.toFixed(2) + 'R' : '—'}</td>
                      <td className="p-2.5 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[0.66rem] font-bold uppercase",
                          t.result === 'WIN' ? "bg-[var(--up)]/10 text-[var(--up)]" : t.result === 'LOSS' ? "bg-[var(--dn)]/10 text-[var(--dn)]" : "bg-[var(--gold)]/10 text-[var(--gold2)]"
                        )}>
                          {t.result}
                        </span>
                      </td>
                      <td className={cn("p-2.5 px-3 font-mono font-bold text-[0.78rem]", t.pnl > 0 ? "text-[var(--up)]" : t.pnl < 0 ? "text-[var(--dn)]" : "text-[var(--t1)]")}>
                        {formatCurrency(t.pnl)}
                      </td>
                      <td className={cn("p-2.5 px-3 font-mono font-bold text-[0.78rem]", cumulativePnl >= 0 ? "text-[var(--up)]" : "text-[var(--dn)]")}>
                        {formatCurrency(cumulativePnl)}
                      </td>
                      <td className="p-2.5 px-3 text-center">
                        {t.imgs.length > 0 ? (
                          <div className="flex gap-1 justify-center">
                            {t.imgs.slice(0, 2).map((img, idx) => (
                              <img key={idx} src={img} onClick={() => onOpenLightbox(t.imgs, idx)} className="w-8 h-8 rounded object-cover cursor-pointer hover:scale-110 transition-transform border border-[var(--wire2)]" />
                            ))}
                            {t.imgs.length > 2 && <div className="w-8 h-8 rounded bg-[var(--ink4)] flex items-center justify-center text-[0.65rem] text-[var(--sky2)] font-bold">+{t.imgs.length - 2}</div>}
                          </div>
                        ) : <span className="text-[var(--t3)]">—</span>}
                      </td>
                      <td className="p-2.5 px-3 text-[var(--t2)] text-[0.73rem] max-w-[140px] truncate" title={t.notes}>{t.notes}</td>
                      <td className="p-2.5 px-3">
                        <button onClick={() => onDeleteTrade(t.id)} className="p-1.5 text-[var(--t3)] hover:text-[var(--dn)] transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function JournalCalendar({ 
  trades, 
  onAddTrade,
  strategies,
  onAddStrategy,
  onDeleteStrategy,
  onOpenLightbox,
  pendingTrade,
  onClearPending
}: { 
  trades: Trade[], 
  onAddTrade: (trade: Omit<Trade, 'id'>) => void,
  strategies: string[],
  onAddStrategy: (strategy: string) => void,
  onDeleteStrategy: (strategy: string) => void,
  onOpenLightbox: (imgs: string[], idx: number) => void,
  pendingTrade?: Partial<Trade> | null,
  onClearPending?: () => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7));
    }
    return w;
  }, [days]);

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [trades]);

  const monthlyPnl = useMemo(() => {
    return trades
      .filter(t => isSameMonth(new Date(t.date), currentDate))
      .reduce((sum, t) => sum + t.pnl, 0);
  }, [trades, currentDate]);

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (n >= 0 ? '+$' : '-$') + formatted;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--ink2)] border border-[var(--wire)] rounded-[var(--r3)] overflow-hidden">
        <div className="flex items-center p-3.5 px-5 border-b border-[var(--wire)] gap-4 bg-white/1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-8 h-8 rounded-lg bg-[var(--ink4)] border border-[var(--wire2)] text-[var(--t1)] flex items-center justify-center hover:border-[var(--sky)] hover:text-[var(--sky2)] transition-all">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[0.92rem] font-bold text-[var(--t0)] min-w-[110px] text-center">{format(currentDate, 'MMM yyyy')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-8 h-8 rounded-lg bg-[var(--ink4)] border border-[var(--wire2)] text-[var(--t1)] flex items-center justify-center hover:border-[var(--sky)] hover:text-[var(--sky2)] transition-all">
            <ChevronRight size={18} />
          </button>
          <div className={cn("text-[1.1rem] font-bold font-mono tracking-tight flex-1 text-center", monthlyPnl > 0 ? "text-[var(--up)]" : monthlyPnl < 0 ? "text-[var(--dn2)]" : "text-[var(--t0)]")}>
            Monthly P/L: {formatCurrency(monthlyPnl)}
          </div>
          <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-3.5 py-1.5 bg-[var(--ink4)] border border-[var(--wire2)] rounded-lg text-[var(--t1)] font-semibold text-[0.78rem] hover:border-[var(--sky)] hover:text-[var(--sky2)] transition-all">Today</button>
        </div>

        <div className="grid grid-cols-[repeat(7,1fr)_110px] border-l border-t border-[var(--wire)] overflow-x-auto">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="p-2 px-2.5 text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-widest text-center border-r border-b border-[var(--wire)] bg-white/1">{d}</div>
          ))}
          <div className="p-2 px-2.5 text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-widest text-center border-r border-b border-[var(--wire)] bg-white/1">Summary</div>
          
          {weeks.map((week, weekIdx) => {
            const weeklyTrades = week.flatMap(day => tradesByDate[format(day, 'yyyy-MM-dd')] || []);
            const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0);
            const weeklyCount = weeklyTrades.length;

            return (
              <React.Fragment key={weekIdx}>
                {week.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayTrades = tradesByDate[dateKey] || [];
                  const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div 
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[96px] border-r border-b border-[var(--wire)] p-2 cursor-pointer transition-all relative",
                        !isCurrentMonth && "bg-black/18 opacity-40",
                        isToday && "shadow-[inset_0_0_0_1.5px_var(--sky)]",
                        isSelected && "bg-[var(--sky)]/6 shadow-[inset_0_0_0_1.5px_var(--sky)]",
                        dayTrades.length > 0 && "hover:bg-white/2"
                      )}
                    >
                      <div className={cn("text-[0.75rem] font-bold leading-none mb-1.5", isToday ? "text-[var(--sky2)]" : "text-[var(--t1)]")}>{format(day, 'd')}</div>
                      {dayTrades.length > 0 && (
                        <>
                          <div className={cn("font-mono text-[0.92rem] font-bold leading-none", dayPnl > 0 ? "text-[var(--up)]" : dayPnl < 0 ? "text-[var(--dn2)]" : "text-[var(--t3)]")}>
                            {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
                          </div>
                          <div className="text-[0.62rem] text-[var(--t2)] mt-1 font-mono">{dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}</div>
                          <div className="flex gap-0.5 flex-wrap mt-1">
                            {dayTrades.slice(0, 6).map(t => (
                              <div key={t.id} className={cn("w-1.5 h-1.5 rounded-full", t.result === 'WIN' ? "bg-[var(--up)]" : t.result === 'LOSS' ? "bg-[var(--dn)]" : "bg-[var(--gold)]")} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                <div className="flex flex-col items-center justify-center border-r border-b border-[var(--wire)] bg-white/2 p-2 text-center">
                  <span className="text-[0.65rem] font-bold text-[var(--t2)] uppercase mb-1">Week {weekIdx + 1}</span>
                  <div className={cn("font-mono text-[0.95rem] font-bold", weeklyPnl > 0 ? "text-[var(--up)]" : weeklyPnl < 0 ? "text-[var(--dn2)]" : "text-[var(--t0)]")}>
                    {weeklyPnl >= 0 ? '+' : ''}{formatCurrency(weeklyPnl)}
                  </div>
                  <div className="text-[0.62rem] text-[var(--t3)] mt-1 font-mono">{weeklyCount} trades</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-[var(--ink2)] border border-[var(--wire)] rounded-[var(--r2)] overflow-hidden animate-fadeUp">
          <div className="flex items-center p-3 px-4.5 border-b border-[var(--wire)] gap-2.5 bg-white/1">
            <div className="w-6 h-6 rounded bg-[var(--violet)]/12 text-[var(--violet2)] flex items-center justify-center text-[0.78rem]">📅</div>
            <div className="text-[0.85rem] font-bold text-[var(--t0)]">{format(selectedDate, 'MMMM d, yyyy')}</div>
            <div className="text-[0.75rem] text-[var(--t2)] font-mono ml-2">{format(selectedDate, 'yyyy-MM-dd')}</div>
            <div className={cn("font-mono text-[0.9rem] font-bold ml-auto", (tradesByDate[format(selectedDate, 'yyyy-MM-dd')]?.reduce((s, t) => s + t.pnl, 0) || 0) > 0 ? "text-[var(--up)]" : "text-[var(--dn2)]")}>
              {formatCurrency(tradesByDate[format(selectedDate, 'yyyy-MM-dd')]?.reduce((s, t) => s + t.pnl, 0) || 0)}
            </div>
            <button onClick={() => setSelectedDate(null)} className="ml-3 p-1.5 text-[var(--t2)] hover:text-[var(--dn)] transition-colors"><X size={18} /></button>
          </div>
          
          <div className="p-4 border-b border-[var(--wire)] bg-white/1">
            <div className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider mb-3">Log Trade for {format(selectedDate, 'MMM d')}</div>
            <TradeForm 
              onAddTrade={onAddTrade}
              strategies={strategies}
              onAddStrategy={onAddStrategy}
              onDeleteStrategy={onDeleteStrategy}
              pendingTrade={pendingTrade}
              onClearPending={onClearPending}
              initialDate={format(selectedDate, 'yyyy-MM-dd')}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["#", "Pair", "Dir", "Result", "Entry", "SL", "TP", "RRR", "P&L", "Chart", "Notes"].map(h => (
                    <th key={h} className="p-2 px-3.5 text-left text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tradesByDate[format(selectedDate, 'yyyy-MM-dd')] || []).length === 0 ? (
                  <tr><td colSpan={11} className="p-7 text-center text-[var(--t2)] text-[0.8rem]">No trades on this day.</td></tr>
                ) : (
                  tradesByDate[format(selectedDate, 'yyyy-MM-dd')].map((t, i) => (
                    <tr key={t.id} className="hover:bg-white/1 transition-colors">
                      <td className="p-2 px-3.5 text-[var(--t2)] font-mono text-[0.78rem]">{i + 1}</td>
                      <td className="p-2 px-3.5 font-bold text-[var(--t0)] text-[0.78rem]">{t.pair}</td>
                      <td className="p-2 px-3.5">
                        <span className={cn("font-bold text-[0.74rem]", t.dir === 'LONG' ? "text-[var(--up)]" : "text-[var(--dn2)]")}>
                          {t.dir === 'LONG' ? '▲' : '▼'} {t.dir}
                        </span>
                      </td>
                      <td className="p-2 px-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[0.66rem] font-bold uppercase",
                          t.result === 'WIN' ? "bg-[var(--up)]/10 text-[var(--up)]" : t.result === 'LOSS' ? "bg-[var(--dn)]/10 text-[var(--dn)]" : "bg-[var(--gold)]/10 text-[var(--gold2)]"
                        )}>
                          {t.result}
                        </span>
                      </td>
                      <td className="p-2 px-3.5 font-mono text-[0.78rem]">{t.entry || '—'}</td>
                      <td className="p-2 px-3.5 font-mono text-[0.78rem]">{t.sl || '—'}</td>
                      <td className="p-2 px-3.5 font-mono text-[0.78rem]">{t.tp || '—'}</td>
                      <td className="p-2 px-3.5 font-mono text-[0.78rem] text-[var(--teal2)]">{t.rrr ? t.rrr.toFixed(2) + 'R' : '—'}</td>
                      <td className={cn("p-2 px-3.5 font-mono font-bold text-[0.78rem]", t.pnl > 0 ? "text-[var(--up)]" : t.pnl < 0 ? "text-[var(--dn)]" : "text-[var(--t1)]")}>
                        {formatCurrency(t.pnl)}
                      </td>
                      <td className="p-2 px-3.5 text-center">
                        {t.imgs.length > 0 ? (
                          <img src={t.imgs[0]} onClick={() => onOpenLightbox(t.imgs, 0)} className="w-9 h-9 rounded object-cover cursor-pointer hover:scale-110 transition-transform border border-[var(--wire2)] mx-auto" />
                        ) : <span className="text-[var(--t3)]">—</span>}
                      </td>
                      <td className="p-2 px-3.5 text-[var(--t2)] text-[0.73rem] max-w-[150px] truncate" title={t.notes}>{t.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
