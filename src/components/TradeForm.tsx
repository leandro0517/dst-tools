import React, { useState, useMemo, ChangeEvent, useEffect, useRef } from "react";
import { Trade, TradeResult, TradeDirection } from "../types";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

interface TradeFormProps {
  onAddTrade: (trade: Omit<Trade, 'id'>) => void;
  strategies: string[];
  onAddStrategy: (strategy: string) => void;
  onDeleteStrategy: (strategy: string) => void;
  pendingTrade?: Partial<Trade> | null;
  onClearPending?: () => void;
  initialDate?: string;
}

export function TradeForm({
  onAddTrade,
  strategies,
  onAddStrategy,
  onDeleteStrategy,
  pendingTrade,
  onClearPending,
  initialDate
}: TradeFormProps) {
  const [form, setForm] = useState({
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    pair: '',
    dir: 'LONG' as TradeDirection,
    result: 'WIN' as TradeResult,
    entry: '',
    sl: '',
    tp: '',
    pnl: '',
    notes: '',
    imgs: [] as string[],
    strategy: '',
    tags: [] as string[]
  });

  const [newStrategy, setNewStrategy] = useState("");
  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setForm(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  useEffect(() => {
    if (pendingTrade) {
      setForm(prev => ({
        ...prev,
        date: pendingTrade.date || prev.date,
        pair: pendingTrade.pair || prev.pair,
        dir: pendingTrade.dir || prev.dir,
        entry: pendingTrade.entry?.toString() || prev.entry,
        sl: pendingTrade.sl?.toString() || prev.sl,
        tp: pendingTrade.tp?.toString() || prev.tp,
      }));
    }
  }, [pendingTrade]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      handleImgUpload(e);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImgUpload(e);
  };

  const liveAnalysis = useMemo(() => {
    const entry = parseFloat(form.entry);
    const sl = parseFloat(form.sl);
    const tp = parseFloat(form.tp);
    if (!entry || !sl) return null;

    const stopDist = Math.abs(entry - sl);
    const tpDist = tp ? Math.abs(tp - entry) : 0;
    const rrr = stopDist > 0 ? tpDist / stopDist : 0;
    
    return { rrr, stopDist, tpDist };
  }, [form.entry, form.sl, form.tp]);

  const handleAdd = () => {
    const rawPnl = Math.abs(parseFloat(form.pnl)) || 0;
    const pnl = form.result === 'LOSS' ? -rawPnl : (form.result === 'BE' ? 0 : rawPnl);
    
    let rrr = 0;
    const entry = parseFloat(form.entry);
    const sl = parseFloat(form.sl);
    const tp = parseFloat(form.tp);
    if (entry && sl && tp) {
      const sd = Math.abs(entry - sl);
      const td = Math.abs(tp - entry);
      rrr = sd > 0 ? td / sd : 0;
    }

    onAddTrade({
      date: form.date,
      pair: form.pair.toUpperCase(),
      dir: form.dir,
      result: form.result,
      entry: entry || 0,
      sl: sl || 0,
      tp: tp || 0,
      pnl,
      rrr,
      notes: form.notes,
      imgs: form.imgs,
      img: form.imgs[0] || null,
      strategy: form.strategy,
      tags: form.tags
    });

    setForm({
      ...form,
      pair: '',
      entry: '',
      sl: '',
      tp: '',
      pnl: '',
      notes: '',
      imgs: [],
      strategy: '',
      tags: []
    });

    if (onClearPending) onClearPending();
  };

  const handleImgUpload = (e: ChangeEvent<HTMLInputElement> | React.DragEvent | ClipboardEvent) => {
    let files: FileList | File[] | null = null;
    
    if ('clipboardData' in e) {
      files = Array.from(e.clipboardData?.files || []);
    } else if ('dataTransfer' in e) {
      files = Array.from(e.dataTransfer.files);
    } else if ('target' in e) {
      files = (e.target as HTMLInputElement).files;
    }

    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setForm(prev => ({ ...prev, imgs: [...prev.imgs, ev.target!.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-[var(--ink2)] border border-[var(--wire)] rounded-xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Date</label>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="p-2 bg-[var(--ink)] border border-[var(--wire)] rounded-md text-[var(--t0)] text-[0.78rem] outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Pair / Ticker</label>
          <input type="text" value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value.toUpperCase() })} placeholder="NQ" className="p-2 bg-[var(--ink)] border border-[var(--wire)] rounded-md text-[var(--t0)] text-[0.78rem] outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Direction</label>
          <div className="flex gap-1">
            <button onClick={() => setForm({ ...form, dir: 'LONG' })} className={cn("flex-1 p-2 border border-[var(--wire)] rounded-md text-[0.75rem] font-bold transition-all", form.dir === 'LONG' ? "bg-[var(--up)]/12 border-[var(--up)] text-[var(--up)]" : "bg-[var(--ink)] text-[var(--t2)]")}>▲ Long</button>
            <button onClick={() => setForm({ ...form, dir: 'SHORT' })} className={cn("flex-1 p-2 border border-[var(--wire)] rounded-md text-[0.75rem] font-bold transition-all", form.dir === 'SHORT' ? "bg-[var(--dn)]/12 border-[var(--dn)] text-[var(--dn2)]" : "bg-[var(--ink)] text-[var(--t2)]")}>▼ Short</button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Result</label>
          <div className="flex gap-1">
            {(['WIN', 'LOSS', 'BE'] as TradeResult[]).map(r => (
              <button 
                key={r}
                onClick={() => setForm({ ...form, result: r })}
                className={cn(
                  "flex-1 p-2 border border-[var(--wire)] rounded-md text-[0.75rem] font-bold transition-all",
                  form.result === r ? (r === 'WIN' ? "bg-[var(--up)]/12 border-[var(--up)] text-[var(--up)]" : r === 'LOSS' ? "bg-[var(--dn)]/12 border-[var(--dn)] text-[var(--dn2)]" : "bg-[var(--gold)]/10 border-[var(--gold)] text-[var(--gold2)]") : "bg-[var(--ink)] text-[var(--t2)]"
                )}
              >
                {r[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Entry Price</label>
          <div className="relative iw">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
            <input type="text" value={form.entry} onChange={e => setForm({ ...form, entry: e.target.value })} className="pl-5.5 py-1.5" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Stop Loss</label>
          <div className="relative iw">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
            <input type="text" value={form.sl} onChange={e => setForm({ ...form, sl: e.target.value })} className="pl-5.5 py-1.5" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Take Profit</label>
          <div className="relative iw">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.72rem] text-[var(--t2)] font-bold">$</span>
            <input type="text" value={form.tp} onChange={e => setForm({ ...form, tp: e.target.value })} className="pl-5.5 py-1.5" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Strategy</label>
          <div className="flex gap-1.5">
            <select 
              value={form.strategy} 
              onChange={e => setForm({ ...form, strategy: e.target.value })}
              className="flex-1 p-2 bg-[var(--ink)] border border-[var(--wire)] rounded-md text-[var(--t0)] text-[0.78rem] outline-none"
            >
              <option value="">No Strategy</option>
              {strategies?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => setIsAddingStrategy(true)}
              className="w-8 h-8 flex items-center justify-center bg-[var(--ink4)] border border-[var(--wire)] rounded-md text-[var(--t2)] hover:text-[var(--sky2)] hover:border-[var(--sky)] transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">P&L ($)</label>
          <div className="relative iw">
            <span className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.82rem] font-bold", form.result === 'LOSS' ? "text-[var(--dn2)]" : "text-[var(--up)]")}>
              {form.result === 'LOSS' ? '-' : '+'}
            </span>
            <input type="text" value={form.pnl} onChange={e => setForm({ ...form, pnl: e.target.value })} className="pl-5.5 py-1.5" />
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Charts & Screenshots</label>
          <div 
            className={cn(
              "border-1.5 border-dashed border-[var(--wire2)] rounded-lg p-3 cursor-pointer transition-all bg-[var(--ink)] min-h-[52px] flex flex-col gap-2",
              form.imgs.length > 0 && "border-[var(--up)] bg-[var(--up)]/3",
              isDragging && "border-[var(--sky)] bg-[var(--sky)]/5 scale-[1.01]"
            )}
            onClick={() => document.getElementById('j-img-input')?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <ImageIcon size={18} className={cn("opacity-55", isDragging && "text-[var(--sky2)] opacity-100")} />
              <span className={cn("text-[0.72rem] text-[var(--t2)]", form.imgs.length > 0 && "text-[var(--up)]", isDragging && "text-[var(--sky2)]")}>
                {isDragging ? "Drop images now" : (form.imgs.length > 0 ? `${form.imgs.length} image${form.imgs.length !== 1 ? 's' : ''} attached` : "Drop images here, paste, or click to upload")}
              </span>
            </div>
            {form.imgs.length > 0 && (
              <div className="grid grid-cols-8 md:grid-cols-12 gap-1.5">
                {form.imgs.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-[var(--wire2)]">
                    <img src={src} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, imgs: prev.imgs.filter((_, idx) => idx !== i) })); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-[var(--dn)] text-white rounded-full flex items-center justify-center text-[0.6rem]"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" id="j-img-input" multiple accept="image/*" className="hidden" onChange={handleImgUpload} />
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
          <label className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-wider">Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Trade notes..." className="p-2 bg-[var(--ink)] border border-[var(--wire)] rounded-md text-[var(--t0)] text-[0.78rem] outline-none" />
        </div>
        <div className="flex items-end">
          <button onClick={handleAdd} className="w-full py-2.5 bg-linear-to-br from-[var(--up)] to-[var(--up2)] border-none rounded-md text-[#051a0d] font-black text-[0.8rem] cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,208,132,0.3)] hover:-translate-y-px">
            <Plus size={16} className="inline mr-1" /> Log Trade
          </button>
        </div>
      </div>

      {liveAnalysis && (
        <div className="flex gap-4 px-4 py-2.5 bg-[var(--sky)]/5 border border-[var(--sky)]/20 rounded-xl animate-fade">
          <div className="flex flex-col">
            <span className="text-[0.58rem] font-bold text-[var(--t2)] uppercase tracking-widest">Risk/Reward</span>
            <span className={cn("font-mono text-[0.85rem] font-bold", liveAnalysis.rrr >= 2 ? "text-[var(--up)]" : "text-[var(--gold2)]")}>
              1 : {liveAnalysis.rrr.toFixed(2)}
            </span>
          </div>
          <div className="w-px h-8 bg-[var(--wire)] self-center" />
          <div className="flex flex-col">
            <span className="text-[0.58rem] font-bold text-[var(--t2)] uppercase tracking-widest">Stop Distance</span>
            <span className="font-mono text-[0.85rem] font-bold text-[var(--t1)]">
              {liveAnalysis.stopDist.toFixed(2)} pts
            </span>
          </div>
          <div className="w-px h-8 bg-[var(--wire)] self-center" />
          <div className="flex flex-col">
            <span className="text-[0.58rem] font-bold text-[var(--t2)] uppercase tracking-widest">Target Distance</span>
            <span className="font-mono text-[0.85rem] font-bold text-[var(--t1)]">
              {liveAnalysis.tpDist.toFixed(2)} pts
            </span>
          </div>
        </div>
      )}

      {isAddingStrategy && (
        <div className="fixed inset-0 bg-black/70 z-600 flex items-center justify-center backdrop-blur-sm animate-fadeUp">
          <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-7 w-[360px] shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
            <div className="text-[1rem] font-bold text-[var(--t0)] mb-1">+ New Strategy</div>
            <div className="text-[0.76rem] text-[var(--t2)] mb-5">Add a new trading strategy to categorize your trades.</div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Strategy Name</label>
                <input 
                  type="text" 
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  placeholder="e.g. Supply & Demand, ICT..." 
                  className="p-2.5 bg-[var(--ink)] border border-[var(--wire)] rounded-[var(--r)] text-[var(--t0)] text-[0.88rem] outline-none focus:border-[var(--sky)] w-full"
                />
              </div>

              {strategies.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Existing Strategies</label>
                  <div className="flex flex-wrap gap-1.5">
                    {strategies.map(s => (
                      <div key={s} className="flex items-center gap-1 px-2 py-1 bg-[var(--ink4)] border border-[var(--wire)] rounded text-[0.7rem] text-[var(--t1)]">
                        <span>{s}</span>
                        <button 
                          onClick={() => onDeleteStrategy(s)}
                          className="hover:text-[var(--dn)] transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button onClick={() => setIsAddingStrategy(false)} className="p-2.5 bg-transparent border border-[var(--wire)] rounded-[var(--r)] text-[var(--t1)] font-semibold text-[0.85rem] cursor-pointer flex-1">Cancel</button>
                <button 
                  onClick={() => {
                    if (newStrategy.trim()) {
                      onAddStrategy(newStrategy.trim());
                      setForm({ ...form, strategy: newStrategy.trim() });
                      setNewStrategy("");
                      setIsAddingStrategy(false);
                    }
                  }}
                  className="flex-1 p-2.5 bg-linear-to-br from-[var(--sky)] to-[#0284c7] border-none rounded-[var(--r)] text-white font-bold text-[0.85rem] cursor-pointer"
                >
                  Add Strategy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
