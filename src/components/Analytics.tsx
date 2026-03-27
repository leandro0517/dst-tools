import { useMemo } from "react";
import { Trade } from "../types";
import { Panel } from "./Common";
import { BarChart3, TrendingUp, TrendingDown, PieChart, Activity, Award, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsProps {
  trades: Trade[];
  onNavigateToJournal?: () => void;
}

export function Analytics({ trades, onNavigateToJournal }: AnalyticsProps) {
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    const wins = trades.filter(t => t.result === 'WIN');
    const losses = trades.filter(t => t.result === 'LOSS');
    const bes = trades.filter(t => t.result === 'BE');
    
    const n = trades.length;
    const wr = (wins.length / n) * 100;
    const net = trades.reduce((s, t) => s + (t.pnl || 0), 0);
    
    const rrrTr = trades.filter(t => t.rrr > 0);
    const avgRRR = rrrTr.length ? rrrTr.reduce((s, t) => s + t.rrr, 0) / rrrTr.length : 0;
    
    const gp = wins.reduce((s, t) => s + (t.pnl || 0), 0);
    const gl = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
    const pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);
    
    const avgW = wins.length ? gp / wins.length : 0;
    const avgL = losses.length ? gl / losses.length : 0;
    const ev = (wr / 100 * avgW) - ((1 - wr / 100) * avgL);

    let peak = 0, cum = 0, maxDD = 0;
    const eq = [0], dd = [0];
    trades.forEach(t => {
      cum += (t.pnl || 0);
      eq.push(cum);
      if (cum > peak) peak = cum;
      const d = Math.max(0, peak - cum);
      if (d > maxDD) maxDD = d;
      dd.push(-d);
    });

    const best = Math.max(...trades.map(t => t.pnl || 0));
    const worst = Math.min(...trades.map(t => t.pnl || 0));

    const strategyStats: Record<string, { n: number, wins: number, pnl: number, wr: number }> = {};
    trades.forEach(t => {
      const s = t.strategy || 'No Strategy';
      if (!strategyStats[s]) strategyStats[s] = { n: 0, wins: 0, pnl: 0, wr: 0 };
      strategyStats[s].n++;
      if (t.result === 'WIN') strategyStats[s].wins++;
      strategyStats[s].pnl += (t.pnl || 0);
    });
    Object.keys(strategyStats).forEach(s => {
      strategyStats[s].wr = (strategyStats[s].wins / strategyStats[s].n) * 100;
    });

    let cw = 0, cl = 0;
    const mw = Math.max(0, ...trades.map((t, i) => {
      if (t.result === 'WIN') { cw++; cl = 0; return cw; }
      if (t.result === 'LOSS') { cl++; cw = 0; return 0; }
      cw = 0; cl = 0; return 0;
    }));
    cw = 0; cl = 0;
    const ml = Math.max(0, ...trades.map((t, i) => {
      if (t.result === 'LOSS') { cl++; cw = 0; return cl; }
      if (t.result === 'WIN') { cw++; cl = 0; return 0; }
      cw = 0; cl = 0; return 0;
    }));

    const monthlyStats: Record<string, number> = {};
    const dayOfWeekStats: Record<string, { n: number, pnl: number, wins: number }> = {
      'Mon': { n: 0, pnl: 0, wins: 0 },
      'Tue': { n: 0, pnl: 0, wins: 0 },
      'Wed': { n: 0, pnl: 0, wins: 0 },
      'Thu': { n: 0, pnl: 0, wins: 0 },
      'Fri': { n: 0, pnl: 0, wins: 0 },
    };

    trades.forEach(t => {
      const m = t.date.substring(0, 7); // YYYY-MM
      monthlyStats[m] = (monthlyStats[m] || 0) + (t.pnl || 0);
      
      const d = new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (dayOfWeekStats[d]) {
        dayOfWeekStats[d].n++;
        dayOfWeekStats[d].pnl += (t.pnl || 0);
        if (t.result === 'WIN') dayOfWeekStats[d].wins++;
      }
    });

    // Advanced Metrics
    const returns = trades.map(t => t.pnl || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpe = stdDev > 0 ? (avgReturn / stdDev) : 0;
    const recoveryFactor = maxDD > 0 ? (net / maxDD) : 0;
    const profitFactor = gl > 0 ? gp / gl : 0;

    const pairStats: Record<string, { n: number, pnl: number, wins: number, wr: number }> = {};
    trades.forEach(t => {
      const p = t.pair || 'Unknown';
      if (!pairStats[p]) pairStats[p] = { n: 0, pnl: 0, wins: 0, wr: 0 };
      pairStats[p].n++;
      pairStats[p].pnl += (t.pnl || 0);
      if (t.result === 'WIN') pairStats[p].wins++;
    });
    Object.keys(pairStats).forEach(p => {
      pairStats[p].wr = (pairStats[p].wins / pairStats[p].n) * 100;
    });

    return {
      n, wr, net, avgRRR, pf, ev, maxDD, best, worst, mw, ml, gp, gl, avgW, avgL, eq, dd, wins: wins.length, losses: losses.length, bes: bes.length, strategyStats, monthlyStats, dayOfWeekStats, sharpe, recoveryFactor, profitFactor, pairStats
    };
  }, [trades]);

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return (n < 0 ? '-$' : '$') + formatted.replace('$', '');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (e: any, elements: any) => {
      if (elements.length > 0 && onNavigateToJournal) {
        onNavigateToJournal();
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111820',
        titleFont: { family: 'Outfit', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'Geist Mono', size: 11 },
        borderColor: '#1f2d3d',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const idx = context[0].dataIndex;
            if (idx === 0) return 'Initial Balance';
            const trade = trades[idx - 1];
            return `${trade.date} - Trade #${idx}`;
          },
          label: (context: any) => {
            const idx = context.dataIndex;
            if (idx === 0) return `Equity: ${formatCurrency(context.raw)}`;
            const trade = trades[idx - 1];
            const lines = [
              `Equity: ${formatCurrency(context.raw)}`,
              `P&L: ${formatCurrency(trade.pnl)} (${trade.result})`,
              `Pair: ${trade.pair} (${trade.dir})`,
            ];
            if (trade.strategy) lines.push(`Strategy: ${trade.strategy}`);
            if (trade.notes) lines.push(`Notes: ${trade.notes.substring(0, 30)}${trade.notes.length > 30 ? '...' : ''}`);
            return lines;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4d6480', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#4d6480', font: { size: 10 } } }
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-20 text-[var(--t2)] flex-col gap-4">
        <BarChart3 size={48} className="opacity-20" />
        <p>Log trades in the Journal tab to see detailed analytics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {[
          { l: 'Total Trades', v: stats.n, c: 'text-[var(--sky2)]', i: <Activity size={12} /> },
          { l: 'Win Rate', v: stats.wr.toFixed(1) + '%', c: 'text-[var(--up)]', i: <Award size={12} /> },
          { l: 'Net P&L', v: formatCurrency(stats.net), c: stats.net >= 0 ? 'text-[var(--up)]' : 'text-[var(--dn2)]', i: stats.net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} /> },
          { l: 'Avg RRR', v: stats.avgRRR.toFixed(2) + 'R', c: 'text-[var(--teal2)]', i: <Zap size={12} /> },
          { l: 'Profit Factor', v: stats.pf === Infinity ? '∞' : stats.pf.toFixed(2), c: 'text-[var(--violet2)]', i: <Activity size={12} /> },
          { l: 'Expectancy', v: formatCurrency(stats.ev), c: stats.ev >= 0 ? 'text-[var(--up)]' : 'text-[var(--dn2)]', i: <TrendingUp size={12} /> },
          { l: 'Max Drawdown', v: '-' + formatCurrency(stats.maxDD), c: 'text-[var(--dn2)]', i: <TrendingDown size={12} /> },
          { l: 'Best Trade', v: '+' + formatCurrency(stats.best), c: 'text-[var(--up)]', i: <Award size={12} /> },
        ].map((s, idx) => (
          <div key={idx} className="bg-[var(--ink2)] border border-[var(--wire)] rounded-xl p-3.5 flex flex-col gap-1 transition-all hover:border-[var(--wire2)] hover:-translate-y-px">
            <div className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest flex items-center gap-1.5">{s.i} {s.l}</div>
            <div className={cn("font-mono text-[1.18rem] font-bold", s.c)}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <Panel title="Equity Curve" icon={<TrendingUp size={14} />} iconClass="bg-[var(--up)]/12 text-[var(--up)]">
          <div className="h-[210px]">
            <Line 
              data={{
                labels: stats.eq.map((_, i) => i === 0 ? 'Start' : '#' + i),
                datasets: [{
                  data: stats.eq,
                  borderColor: stats.net >= 0 ? '#00d084' : '#ff4757',
                  backgroundColor: stats.net >= 0 ? 'rgba(0,208,132,0.07)' : 'rgba(255,71,87,0.07)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: stats.eq.length > 30 ? 0 : 3,
                  borderWidth: 2
                }]
              }}
              options={chartOptions}
            />
          </div>
        </Panel>
        <Panel title="Drawdown" icon={<TrendingDown size={14} />} iconClass="bg-[var(--dn)]/12 text-[var(--dn)]">
          <div className="h-[210px]">
            <Line 
              data={{
                labels: stats.dd.map((_, i) => i === 0 ? 'Start' : '#' + i),
                datasets: [{
                  data: stats.dd,
                  borderColor: '#ff4757',
                  backgroundColor: 'rgba(255,71,87,0.07)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: stats.dd.length > 30 ? 0 : 2,
                  borderWidth: 2
                }]
              }}
              options={chartOptions}
            />
          </div>
        </Panel>
        <Panel title="Win / Loss Breakdown" icon={<PieChart size={14} />} iconClass="bg-[var(--sky)]/12 text-[var(--sky2)]">
          <div className="h-[210px]">
            <Doughnut 
              data={{
                labels: ['Wins', 'Losses', 'BE'],
                datasets: [{
                  data: [stats.wins, stats.losses, stats.bes],
                  backgroundColor: ['#00d084', '#ff4757', '#f59e0b'],
                  borderColor: '#0d1117',
                  borderWidth: 3
                }]
              }}
              options={{
                ...chartOptions,
                cutout: '68%',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: true, position: 'bottom', labels: { color: '#8fa3be', font: { family: 'Outfit', size: 11 } } }
                }
              }}
            />
          </div>
        </Panel>
        <Panel title="P&L Per Trade" icon={<BarChart3 size={14} />} iconClass="bg-[var(--violet)]/12 text-[var(--violet2)]">
          <div className="h-[210px]">
            <Bar 
              data={{
                labels: trades.map((_, i) => '#' + (i + 1)),
                datasets: [{
                  data: trades.map(t => t.pnl || 0),
                  backgroundColor: trades.map(t => (t.pnl || 0) >= 0 ? 'rgba(0,208,132,0.5)' : 'rgba(255,71,87,0.5)'),
                  borderColor: trades.map(t => (t.pnl || 0) >= 0 ? '#00d084' : '#ff4757'),
                  borderWidth: 1,
                  borderRadius: 3
                }]
              }}
              options={chartOptions}
            />
          </div>
        </Panel>
        <Panel title="Monthly Performance" icon={<BarChart3 size={14} />} iconClass="bg-[var(--sky)]/12 text-[var(--sky2)]">
          <div className="h-[210px]">
            <Bar 
              data={{
                labels: Object.keys(stats.monthlyStats).sort(),
                datasets: [{
                  data: Object.keys(stats.monthlyStats).sort().map(m => stats.monthlyStats[m]),
                  backgroundColor: Object.keys(stats.monthlyStats).sort().map(m => stats.monthlyStats[m] >= 0 ? 'rgba(0,208,132,0.5)' : 'rgba(255,71,87,0.5)'),
                  borderColor: Object.keys(stats.monthlyStats).sort().map(m => stats.monthlyStats[m] >= 0 ? '#00d084' : '#ff4757'),
                  borderWidth: 1,
                  borderRadius: 3
                }]
              }}
              options={chartOptions}
            />
          </div>
        </Panel>
        <Panel title="Performance by Day" icon={<Activity size={14} />} iconClass="bg-[var(--teal)]/12 text-[var(--teal2)]">
          <div className="h-[210px]">
            <Bar 
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                  label: 'P&L',
                  data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => stats.dayOfWeekStats[d].pnl),
                  backgroundColor: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => stats.dayOfWeekStats[d].pnl >= 0 ? 'rgba(0,208,132,0.5)' : 'rgba(255,71,87,0.5)'),
                  borderColor: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => stats.dayOfWeekStats[d].pnl >= 0 ? '#00d084' : '#ff4757'),
                  borderWidth: 1,
                  borderRadius: 3
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        const day = context.label;
                        const s = stats.dayOfWeekStats[day];
                        return [
                          `P&L: ${formatCurrency(s.pnl)}`,
                          `Win Rate: ${s.n ? (s.wins / s.n * 100).toFixed(1) : 0}%`,
                          `Trades: ${s.n}`
                        ];
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Panel>
        <Panel title="Performance by Pair" icon={<Activity size={14} />} iconClass="bg-[var(--sky)]/12 text-[var(--sky2)]">
          <div className="h-[210px]">
            <Bar 
              data={{
                labels: Object.keys(stats.pairStats).sort((a, b) => stats.pairStats[b].pnl - stats.pairStats[a].pnl),
                datasets: [{
                  label: 'P&L',
                  data: Object.keys(stats.pairStats).sort((a, b) => stats.pairStats[b].pnl - stats.pairStats[a].pnl).map(p => stats.pairStats[p].pnl),
                  backgroundColor: Object.keys(stats.pairStats).sort((a, b) => stats.pairStats[b].pnl - stats.pairStats[a].pnl).map(p => stats.pairStats[p].pnl >= 0 ? 'rgba(0,208,132,0.5)' : 'rgba(255,71,87,0.5)'),
                  borderColor: Object.keys(stats.pairStats).sort((a, b) => stats.pairStats[b].pnl - stats.pairStats[a].pnl).map(p => stats.pairStats[p].pnl >= 0 ? '#00d084' : '#ff4757'),
                  borderWidth: 1,
                  borderRadius: 3
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        const pair = context.label;
                        const s = stats.pairStats[pair];
                        return [
                          `P&L: ${formatCurrency(s.pnl)}`,
                          `Win Rate: ${s.n ? (s.wins / s.n * 100).toFixed(1) : 0}%`,
                          `Trades: ${s.n}`
                        ];
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <Panel title="Strategy Comparison" icon={<PieChart size={14} />} iconClass="bg-[var(--violet)]/12 text-[var(--violet2)]">
          <div className="h-[280px] flex items-center justify-center">
            {Object.keys(stats.strategyStats).length > 2 ? (
              <Radar 
                data={{
                  labels: ['Win Rate', 'Expectancy', 'Avg RRR', 'Profit Factor', 'Trades'],
                  datasets: Object.entries(stats.strategyStats).slice(0, 4).map(([name, s]: [string, any], i) => {
                    // Normalize values for radar chart (0-100 scale)
                    const maxRRR = Math.max(...Object.values(stats.strategyStats).map((st: any) => st.n ? st.pnl / st.n : 0), 1);
                    const maxN = Math.max(...Object.values(stats.strategyStats).map((st: any) => st.n), 1);
                    
                    return {
                      label: name,
                      data: [
                        s.wr,
                        Math.min(100, (s.pnl / s.n / maxRRR) * 100),
                        Math.min(100, (s.wr / 100 * 3) * 33), // Simplified RRR representation
                        Math.min(100, (s.pnl > 0 ? 100 : 0)),
                        (s.n / maxN) * 100
                      ],
                      backgroundColor: `rgba(${[100, 200, 255][i % 3] || 150}, ${[200, 100, 255][i % 3] || 150}, ${[255, 200, 100][i % 3] || 150}, 0.2)`,
                      borderColor: `rgba(${[100, 200, 255][i % 3] || 150}, ${[200, 100, 255][i % 3] || 150}, ${[255, 200, 100][i % 3] || 150}, 1)`,
                      borderWidth: 2,
                      pointRadius: 3
                    };
                  })
                }}
                options={{
                  ...chartOptions,
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(255,255,255,0.05)' },
                      grid: { color: 'rgba(255,255,255,0.05)' },
                      pointLabels: { color: '#8fa3be', font: { size: 10 } },
                      ticks: { display: false, count: 5 }
                    }
                  },
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: true, position: 'bottom', labels: { color: '#8fa3be', font: { size: 10 }, boxWidth: 10 } }
                  }
                }}
              />
            ) : (
              <div className="text-[var(--t3)] text-[0.75rem] text-center px-10">Add at least 3 strategies to see the comparison radar.</div>
            )}
          </div>
        </Panel>

        <Panel title="Advanced Risk Metrics" icon={<Zap size={14} />} iconClass="bg-[var(--gold)]/12 text-[var(--gold2)]" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Sharpe Ratio', v: stats.sharpe.toFixed(2), d: 'Risk-adjusted return performance.', c: 'text-[var(--sky2)]' },
              { l: 'Recovery Factor', v: stats.recoveryFactor.toFixed(2), d: 'Net P&L divided by Max Drawdown.', c: 'text-[var(--up)]' },
              { l: 'Profit Factor', v: stats.profitFactor.toFixed(2), d: 'Gross Profit / Gross Loss.', c: 'text-[var(--violet2)]' },
              { l: 'Expectancy', v: formatCurrency(stats.ev), d: 'Average expected value per trade.', c: stats.ev >= 0 ? 'text-[var(--up)]' : 'text-[var(--dn2)]' },
            ].map((m, i) => (
              <div key={i} className="bg-white/2 border border-[var(--wire)] rounded-xl p-4 flex flex-col gap-1">
                <div className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest">{m.l}</div>
                <div className={cn("font-mono text-[1.4rem] font-bold", m.c)}>{m.v}</div>
                <div className="text-[0.62rem] text-[var(--t3)] leading-tight mt-1">{m.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/1 rounded-xl p-4 border border-[var(--wire)]">
              <h4 className="text-[0.7rem] font-bold text-[var(--t1)] uppercase tracking-wider mb-3">Consecutive Streaks</h4>
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-[var(--t2)] uppercase font-bold">Max Wins</span>
                  <span className="text-[1.5rem] font-bold text-[var(--up)]">{stats.mw}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-[var(--t2)] uppercase font-bold">Max Losses</span>
                  <span className="text-[1.5rem] font-bold text-[var(--dn2)]">{stats.ml}</span>
                </div>
                <div className="flex-1 h-12 flex items-center gap-1">
                  {trades.slice(-20).map((t, i) => (
                    <div key={i} className={cn("flex-1 h-full rounded-sm", t.result === 'WIN' ? "bg-[var(--up)]/40" : t.result === 'LOSS' ? "bg-[var(--dn2)]/40" : "bg-[var(--t3)]/20")} />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white/1 rounded-xl p-4 border border-[var(--wire)]">
              <h4 className="text-[0.7rem] font-bold text-[var(--t1)] uppercase tracking-wider mb-3">Profitability Index</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.65rem] text-[var(--t2)]">Current Win Rate</span>
                <span className="text-[0.65rem] font-bold text-[var(--t0)]">{stats.wr.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--wire)] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[var(--up)]" style={{ width: `${stats.wr}%` }} />
              </div>
              <p className="text-[0.62rem] text-[var(--t3)] italic">
                {stats.ev > 0 
                  ? "Your current strategy has positive expectancy. Focus on consistency and execution."
                  : "Negative expectancy detected. Review your risk management and entry criteria."}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Strategy Performance" icon={<Award size={14} />} iconClass="bg-[var(--sky)]/12 text-[var(--sky2)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(stats.strategyStats).map(([name, s]: [string, any]) => (
            <div key={name} className="bg-[var(--ink2)] border border-[var(--wire)] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] font-bold text-[var(--t0)] truncate max-w-[160px]">{name}</span>
                <span className="text-[0.62rem] font-mono text-[var(--t2)]">{s.n} Trades</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-widest">Net P&L</span>
                  <span className={cn("font-mono text-[1.1rem] font-bold", s.pnl >= 0 ? "text-[var(--up)]" : "text-[var(--dn2)]")}>
                    {formatCurrency(s.pnl)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-widest">Win Rate</span>
                  <span className="font-mono text-[0.95rem] font-bold text-[var(--t0)]">{s.wr.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[var(--wire)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--up)] transition-all duration-500" 
                  style={{ width: `${s.wr}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Detailed Statistics" icon={<Activity size={14} />} iconClass="bg-[var(--gold)]/12 text-[var(--gold2)]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { l: 'Total Wins', v: stats.wins, c: 'text-[var(--up)]', bc: '#00d084' },
            { l: 'Total Losses', v: stats.losses, c: 'text-[var(--dn2)]', bc: '#ff4757' },
            { l: 'Break-even', v: stats.bes, c: 'text-[var(--gold2)]', bc: '#f59e0b' },
            { l: 'Avg Win', v: '+' + formatCurrency(stats.avgW), c: 'text-[var(--up)]', bc: '#00d084' },
            { l: 'Avg Loss', v: '-' + formatCurrency(stats.avgL), c: 'text-[var(--dn2)]', bc: '#ff4757' },
            { l: 'Win/Loss Ratio', v: stats.avgL > 0 ? (stats.avgW / stats.avgL).toFixed(2) : '∞', c: 'text-[var(--teal2)]', bc: '#14b8a6' },
            { l: 'Worst Trade', v: formatCurrency(stats.worst), c: 'text-[var(--dn2)]', bc: '#ff4757' },
            { l: 'Max Consec Wins', v: stats.mw, c: 'text-[var(--up)]', bc: '#00d084' },
            { l: 'Max Consec Losses', v: stats.ml, c: 'text-[var(--dn2)]', bc: '#ff4757' },
            { l: 'Gross Profit', v: '+' + formatCurrency(stats.gp), c: 'text-[var(--up)]', bc: '#00d084' },
            { l: 'Gross Loss', v: '-' + formatCurrency(stats.gl), c: 'text-[var(--dn2)]', bc: '#ff4757' },
            { l: 'Expectancy', v: formatCurrency(stats.ev), c: stats.ev >= 0 ? 'text-[var(--up)]' : 'text-[var(--dn2)]', bc: stats.ev >= 0 ? '#00d084' : '#ff4757' },
          ].map((s, idx) => (
            <div key={idx} className="bg-[var(--ink2)] border border-[var(--wire)] rounded-lg p-3.5 border-t-2" style={{ borderTopColor: s.bc }}>
              <div className="text-[0.6rem] text-[var(--t2)] uppercase font-bold tracking-widest mb-1">{s.l}</div>
              <div className={cn("font-mono text-[1.05rem] font-bold", s.c)}>{s.v}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
