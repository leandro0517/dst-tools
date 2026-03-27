import { useState, useMemo } from "react";
import { Panel, MetricTile } from "./Common";
import { Target, TrendingUp, Rocket } from "lucide-react";
import { cn } from "../lib/utils";

interface DailyTargetProps {
  liveBalance: number;
  winRate: string;
  riskPct: string;
  onUpdateWinRate: (wr: string) => void;
  onUpdateRiskPct: (rp: string) => void;
}

export function DailyTarget({ 
  liveBalance, 
  winRate, 
  riskPct, 
  onUpdateWinRate, 
  onUpdateRiskPct 
}: DailyTargetProps) {
  const [targetPct, setTargetPct] = useState('1');
  const [rrr, setRrr] = useState('2');
  const [daysPerMonth, setDaysPerMonth] = useState('20');

  const results = useMemo(() => {
    const bal = liveBalance;
    const tPct = parseFloat(targetPct) || 1;
    const avgRrr = parseFloat(rrr) || 2;
    const wr = (parseFloat(winRate) || 55) / 100;
    const rPct = parseFloat(riskPct) || 1;
    const days = parseInt(daysPerMonth) || 20;

    const dailyTarget = bal * (tPct / 100);
    const riskAmt = bal * (rPct / 100);
    const rewardAmt = riskAmt * avgRrr;
    const evPerTrade = (wr * rewardAmt) - ((1 - wr) * riskAmt);
    const tradesNeeded = evPerTrade > 0 ? Math.ceil(dailyTarget / evPerTrade) : Infinity;

    return {
      dailyTarget,
      weeklyTarget: dailyTarget * 5,
      monthlyTarget: dailyTarget * days,
      tradesNeeded,
      evPerTrade,
      maxDailyLoss: Math.min(bal * 0.03, riskAmt * 3)
    };
  }, [liveBalance, targetPct, rrr, winRate, riskPct, daysPerMonth]);

  const compounding = useMemo(() => {
    const bal = liveBalance;
    const tPct = parseFloat(targetPct) || 1;
    const days = parseInt(daysPerMonth) || 20;
    
    return [
      { n: '1 Week', d: 5 },
      { n: '2 Weeks', d: 10 },
      { n: '1 Month', d: days, hl: true },
      { n: '3 Months', d: days * 3 },
      { n: '6 Months', d: days * 6 },
      { n: '1 Year', d: days * 12, hl: true },
    ].map(p => {
      const projected = bal * Math.pow(1 + tPct / 100, p.d);
      const pnl = projected - bal;
      const growth = ((projected / bal) - 1) * 100;
      return { ...p, projected, pnl, growth };
    });
  }, [liveBalance, targetPct, daysPerMonth]);

  const formatCurrency = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      <Panel title="Daily Target Settings" icon={<Target size={14} />} iconClass="bg-[var(--up)]/12 text-[var(--up)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Account Balance</label>
            <div className="relative iw">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
              <input type="text" value={liveBalance.toLocaleString()} readOnly className="pl-6 bg-[var(--sky)]/4 border-[var(--sky)]/20 text-[var(--sky2)]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Daily Target %</label>
            <div className="relative iw">
              <input type="text" value={targetPct} onChange={(e) => setTargetPct(e.target.value)} className="pr-8" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">%</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {['0.5', '1', '2', '3'].map(v => (
                <button 
                  key={v}
                  onClick={() => setTargetPct(v)}
                  className={cn(
                    "px-2.5 py-1 bg-[var(--ink4)] border border-[var(--wire)] text-[var(--t2)] rounded-md font-mono text-[0.7rem] font-semibold cursor-pointer transition-all duration-150 hover:border-[var(--sky)] hover:text-[var(--sky2)]",
                    targetPct === v && "border-[var(--sky)] text-[var(--sky2)] bg-[var(--sky)]/10"
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Avg RRR</label>
              <div className="relative iw">
                <input type="text" value={rrr} onChange={(e) => setRrr(e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">R</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Win Rate</label>
              <div className="relative iw">
                <input type="text" value={winRate} onChange={(e) => onUpdateWinRate(e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Risk / Trade</label>
              <div className="relative iw">
                <input type="text" value={riskPct} onChange={(e) => onUpdateRiskPct(e.target.value)} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.66rem] font-bold text-[var(--t2)] uppercase tracking-widest">Days / Month</label>
              <div className="iw">
                <input type="text" value={daysPerMonth} onChange={(e) => setDaysPerMonth(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Target Breakdown" icon={<TrendingUp size={14} />} iconClass="bg-[var(--sky)]/14 text-[var(--sky2)]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 bg-[var(--wire)] rounded-xl overflow-hidden">
            <MetricTile label="Daily Target" value={formatCurrency(results.dailyTarget)} variant="up" />
            <MetricTile label="Weekly" value={formatCurrency(results.weeklyTarget)} variant="sky" />
            <MetricTile label="Monthly" value={formatCurrency(results.monthlyTarget)} variant="violet" />
            <MetricTile label="Trades/Day Needed" value={results.tradesNeeded === Infinity ? "∞" : results.tradesNeeded.toString()} variant="gold" />
            <MetricTile label="EV Per Trade" value={(results.evPerTrade >= 0 ? "+" : "") + formatCurrency(results.evPerTrade)} variant="teal" />
            <MetricTile label="Max Daily Loss" value={"-" + formatCurrency(results.maxDailyLoss)} variant="dn" />
          </div>
        </Panel>

        <Panel title="Compounding Projection" icon={<Rocket size={14} />} iconClass="bg-[var(--up)]/12 text-[var(--up)]">
          <div className="-mx-4 -mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Timeframe</th>
                  <th className="p-3 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Projected Balance</th>
                  <th className="p-3 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Growth</th>
                  <th className="p-3 px-4 text-left text-[0.61rem] font-bold text-[var(--t2)] uppercase tracking-wider border-b border-[var(--wire)]">Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {compounding.map((p, idx) => (
                  <tr key={idx} className={cn("hover:bg-white/2 transition-colors", p.hl && "bg-[var(--sky)]/5")}>
                    <td className="p-3 px-4 text-[0.75rem] text-[var(--t1)] font-semibold">{p.n}</td>
                    <td className="p-3 px-4 font-mono text-[0.84rem] font-bold text-[var(--sky2)]">{formatCurrency(p.projected)}</td>
                    <td className="p-3 px-4 font-mono text-[0.76rem] text-[var(--up)]">+{p.growth.toFixed(1)}%</td>
                    <td className="p-3 px-4 font-mono text-[0.84rem] font-bold text-[var(--up)]">+{formatCurrency(p.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
