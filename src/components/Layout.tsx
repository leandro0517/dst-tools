import { LayoutPanelLeft, Clock, BookOpen, BarChart3, ChevronDown, Plus, Trash2, Check, Pencil, Download, Upload, Book } from "lucide-react";
import { cn } from "../lib/utils";
import { NavTab } from "./Common";
import { Profile, ProfilesMeta } from "../types";
import { useState, useRef, useEffect } from "react";
import { PROFILE_COLORS } from "../constants";

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  meta: ProfilesMeta;
  currentProfile: Profile;
  switchProfile: (pid: string) => void;
  createProfile: (name: string, balance: number, color: string) => void;
  deleteProfile: (pid: string) => void;
  liveBalance: number;
  tradeCount: number;
  realizedPnl: number;
  onExport: () => void;
  onImport: () => void;
}

export function TopBar({ 
  activeTab, 
  setActiveTab, 
  meta, 
  currentProfile, 
  switchProfile, 
  createProfile, 
  deleteProfile,
  liveBalance,
  tradeCount,
  realizedPnl,
  onExport,
  onImport
}: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = currentProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="sticky top-0 z-200 bg-[var(--ink)]/96 backdrop-blur-[28px] saturate-[160%] border-b border-white/6 flex items-center px-5 h-[58px] gap-0 shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mr-7 shrink-0">
          <div className="h-[30px] px-2.5 bg-linear-to-br from-[#0ea5e9] to-[#00d084] rounded-lg flex items-center justify-center text-[0.62rem] font-black tracking-wider text-white font-mono shadow-[0_2px_12px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] whitespace-nowrap">
            DST
          </div>
          <div className="text-[1rem] font-extrabold text-[var(--t0)] tracking-tight">
            DST <span className="text-[var(--sky2)]">Tools</span>
          </div>
        </div>

        <nav className="flex items-center gap-px flex-1 px-1">
          <NavTab id="calc" activeId={activeTab} onClick={setActiveTab} icon={LayoutPanelLeft} label="Calculator" />
          <NavTab id="daily" activeId={activeTab} onClick={setActiveTab} icon={Clock} label="Daily Target" />
          <NavTab id="journal" activeId={activeTab} onClick={setActiveTab} icon={BookOpen} label="Journal" />
          <NavTab id="analytics" activeId={activeTab} onClick={setActiveTab} icon={BarChart3} label="Analytics" />
          <NavTab id="reflections" activeId={activeTab} onClick={setActiveTab} icon={Book} label="Reflections" />
        </nav>

        <div className="hidden md:flex items-center gap-0 ml-2.5 font-mono text-[0.7rem] bg-white/3 border border-white/6 rounded-lg p-0.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 border-r border-white/5 h-[34px]">
            <span className="text-[var(--t2)] font-bold tracking-wider uppercase">NQ</span>
            <span className="text-[var(--t0)] font-bold">21,482.25</span>
            <span className="text-[var(--up)]">+0.42%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 border-r border-white/5 h-[34px]">
            <span className="text-[var(--t2)] font-bold tracking-wider uppercase">ES</span>
            <span className="text-[var(--t0)] font-bold">5,842.50</span>
            <span className="text-[var(--dn)]">-0.18%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 h-[34px]">
            <span className="text-[var(--t2)] font-bold tracking-wider uppercase">GC</span>
            <span className="text-[var(--t0)] font-bold">3,024.10</span>
            <span className="text-[var(--up)]">+0.31%</span>
          </div>
        </div>

        <div className="relative ml-3 shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 bg-white/4 border border-white/8 rounded-lg cursor-pointer transition-all duration-180 min-width-0 hover:border-[var(--sky)] hover:bg-[var(--ink4)]",
              isProfileOpen && "border-[var(--sky)] bg-[var(--ink4)]"
            )}
          >
            <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[0.7rem] font-extrabold text-white shrink-0" style={{ backgroundColor: currentProfile.color }}>
              {initials}
            </div>
            <span className="text-[0.78rem] font-semibold text-[var(--t0)] flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
              {currentProfile.name}
            </span>
            <ChevronDown size={10} className={cn("text-[var(--t2)] transition-transform duration-200", isProfileOpen && "rotate-180")} />
          </button>

          {isProfileOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r2)] shadow-[0_16px_48px_rgba(0,0,0,0.7)] z-500 overflow-hidden animate-fadeUp">
              <div className="p-3 px-4 border-b border-[var(--wire)] flex items-center justify-between">
                <span className="text-[0.62rem] font-bold text-[var(--t2)] uppercase tracking-widest">👤 Trading Accounts</span>
                <span className="text-[0.64rem] text-[var(--t2)] font-mono">{meta.profiles.length} account{meta.profiles.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-[260px] overflow-y-auto p-1.5">
                {meta.profiles.map(p => {
                  const pInitials = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  const isActive = p.id === currentProfile.id;
                  return (
                    <div 
                      key={p.id}
                      onClick={() => { switchProfile(p.id); setIsProfileOpen(false); }}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-130 mb-0.5 hover:bg-white/4",
                        isActive && "bg-[var(--sky)]/9 border border-[var(--sky)]/20"
                      )}
                    >
                      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[0.78rem] font-extrabold text-white shrink-0" style={{ backgroundColor: p.color }}>
                        {pInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.82rem] font-semibold text-[var(--t0)] whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
                        <div className="text-[0.66rem] text-[var(--t2)] font-mono mt-px">Active Profile</div>
                      </div>
                      {isActive && <Check size={14} className="text-[var(--sky2)] shrink-0" />}
                      {meta.profiles.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                          className="bg-none border-none text-[var(--t3)] cursor-pointer p-1 rounded-md text-[0.75rem] shrink-0 transition-all duration-130 hover:bg-[var(--dn)]/12 hover:text-[var(--dn)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-2.5 border-t border-[var(--wire)] flex flex-col gap-2">
                <button 
                  onClick={() => { setIsCreateModalOpen(true); setIsProfileOpen(false); }}
                  className="w-full p-2.5 bg-[var(--sky)]/8 border border-dashed border-[var(--sky)]/30 rounded-lg text-[var(--sky2)] font-semibold text-[0.78rem] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 hover:bg-[var(--sky)]/14 hover:border-[var(--sky)]"
                >
                  <Plus size={14} /> New Profile / Account
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { onExport(); setIsProfileOpen(false); }}
                    className="p-2 bg-[var(--ink4)] border border-[var(--wire)] rounded-lg text-[var(--t2)] font-semibold text-[0.68rem] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
                  >
                    <Download size={12} /> Export
                  </button>
                  <button 
                    onClick={() => { onImport(); setIsProfileOpen(false); }}
                    className="p-2 bg-[var(--ink4)] border border-[var(--wire)] rounded-lg text-[var(--t2)] font-semibold text-[0.68rem] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
                  >
                    <Upload size={12} /> Import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-[var(--sky)] to-transparent opacity-70" />

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-600 flex items-center justify-center backdrop-blur-sm animate-fadeUp">
          <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-7 w-[360px] shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
            <div className="text-[1rem] font-bold text-[var(--t0)] mb-1">+ New Profile</div>
            <div className="text-[0.76rem] text-[var(--t2)] mb-5">Each profile is a fully separate trading account with its own journal and settings.</div>
            
            <CreateProfileForm 
              onCancel={() => setIsCreateModalOpen(false)} 
              onSubmit={(name, balance, color) => {
                createProfile(name, balance, color);
                setIsCreateModalOpen(false);
              }} 
            />
          </div>
        </div>
      )}
    </>
  );
}

function CreateProfileForm({ onCancel, onSubmit }: { onCancel: () => void, onSubmit: (name: string, balance: number, color: string) => void }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("25,000");
  const [color, setColor] = useState(PROFILE_COLORS[0]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Profile Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Prop Firm Account, Personal..." 
          maxLength={28}
          className="p-2.5 bg-[var(--ink)] border border-[var(--wire)] rounded-[var(--r)] text-[var(--t0)] text-[0.88rem] outline-none focus:border-[var(--sky)] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.07)] w-full"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Account Balance</label>
        <input 
          type="text" 
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="25,000" 
          className="p-2.5 bg-[var(--ink)] border border-[var(--wire)] rounded-[var(--r)] text-[var(--t0)] text-[0.88rem] outline-none focus:border-[var(--sky)] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.07)] w-full font-mono"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PROFILE_COLORS.map(c => (
            <div 
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 rounded-lg cursor-pointer border-2 border-transparent transition-all duration-150 hover:scale-110",
                color === c && "border-white shadow-[0_0_0_2px_var(--sky)]"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onCancel} className="p-2.5 bg-transparent border border-[var(--wire)] rounded-[var(--r)] text-[var(--t1)] font-semibold text-[0.85rem] cursor-pointer transition-all duration-150 hover:border-[var(--wire2)] hover:text-[var(--t0)]">Cancel</button>
        <button 
          onClick={() => onSubmit(name, parseFloat(balance.replace(/,/g, '')) || 0, color)}
          className="flex-1 p-2.5 bg-linear-to-br from-[var(--sky)] to-[#0284c7] border-none rounded-[var(--r)] text-white font-bold text-[0.85rem] cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(14,165,233,0.3)]"
        >
          Create Profile
        </button>
      </div>
    </div>
  );
}

interface BalanceBarProps {
  initialBalance: number;
  realizedPnl: number;
  liveBalance: number;
  tradeCount: number;
  currentProfile: Profile;
  onUpdateInitialBalance: (balance: number) => void;
}

export function BalanceBar({ initialBalance, realizedPnl, liveBalance, tradeCount, currentProfile, onUpdateInitialBalance }: BalanceBarProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pnlPct = initialBalance > 0 ? (realizedPnl / initialBalance) * 100 : 0;
  
  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (n < 0 ? '-$' : '$') + formatted;
  };

  const formatSignedCurrency = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (n >= 0 ? '+$' : '-$') + formatted;
  };

  return (
    <>
      <div className="flex items-center gap-0 bg-[var(--ink)]/92 border-b border-white/5 px-[22px] h-9 overflow-hidden backdrop-blur-md">
        <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/6 h-full">
          <span className="text-[0.58rem] font-bold text-[var(--t3)] uppercase tracking-widest whitespace-nowrap">Starting Balance</span>
          <span className="font-mono text-[0.84rem] font-bold text-[var(--t0)]">{formatCurrency(initialBalance)}</span>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="bg-none border border-[var(--wire)] rounded-sm text-[var(--t2)] text-[0.6rem] font-semibold px-2 py-0.5 cursor-pointer transition-all duration-150 hover:border-[var(--sky)] hover:text-[var(--sky2)]"
          >
            <Pencil size={10} className="inline mr-1" /> Edit
          </button>
        </div>
        <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/6 h-full">
          <span className="text-[0.58rem] font-bold text-[var(--t3)] uppercase tracking-widest whitespace-nowrap">Realized P&L</span>
          <span className={cn("font-mono text-[0.84rem] font-bold", realizedPnl > 0 ? "text-[var(--up)]" : realizedPnl < 0 ? "text-[var(--dn2)]" : "text-[var(--t0)]")}>
            {formatSignedCurrency(realizedPnl)}
          </span>
          <span className={cn("font-mono text-[0.68rem] font-semibold px-1.5 py-0.5 rounded", realizedPnl > 0 ? "bg-[var(--up)]/10 text-[var(--up)]" : realizedPnl < 0 ? "bg-[var(--dn)]/10 text-[var(--dn2)]" : "bg-[var(--ink4)] text-[var(--t2)]")}>
            {(pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/6 h-full">
          <span className="text-[0.58rem] font-bold text-[var(--t3)] uppercase tracking-widest whitespace-nowrap">Live Balance</span>
          <span className={cn("font-mono text-[1rem] font-bold", realizedPnl > 0 ? "text-[var(--up)]" : realizedPnl < 0 ? "text-[var(--dn2)]" : "text-[var(--t0)]")}>
            {formatCurrency(liveBalance)}
          </span>
        </div>
        <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/6 h-full">
          <span className="text-[0.58rem] font-bold text-[var(--t3)] uppercase tracking-widest whitespace-nowrap">Trades</span>
          <span className="font-mono text-[0.84rem] font-bold text-[var(--t0)]">{tradeCount}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 h-full border-none">
          <span className="text-[0.58rem] font-bold text-[var(--sky2)] uppercase tracking-widest whitespace-nowrap">{currentProfile.name}</span>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/65 z-600 flex items-center justify-center backdrop-blur-sm animate-fadeUp">
          <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-6.5 w-[340px] shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
            <div className="text-[0.95rem] font-bold text-[var(--t0)] mb-1">✎ Set Starting Balance</div>
            <div className="text-[0.74rem] text-[var(--t2)] mb-[18px] leading-relaxed">This is your account starting balance. The app will automatically add/subtract your trade P&L to calculate your live balance.</div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[0.64rem] font-bold text-[var(--t2)] uppercase tracking-wider">Starting Balance</label>
              <input 
                type="text" 
                defaultValue={initialBalance.toLocaleString()}
                id="ebal-input"
                className="p-2.5 bg-[var(--ink)] border border-[var(--wire)] rounded-[var(--r)] text-[var(--t0)] font-mono text-[0.95rem] outline-none focus:border-[var(--sky)] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.07)] w-full"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditModalOpen(false)} className="p-2.5 px-4 bg-transparent border border-[var(--wire)] rounded-[var(--r)] text-[var(--t1)] font-semibold text-[0.85rem] cursor-pointer">Cancel</button>
              <button 
                onClick={() => {
                  const val = parseFloat((document.getElementById('ebal-input') as HTMLInputElement).value.replace(/,/g, ''));
                  if (!isNaN(val)) onUpdateInitialBalance(val);
                  setIsEditModalOpen(false);
                }}
                className="flex-1 p-2.5 bg-linear-to-br from-[var(--sky)] to-[#0284c7] border-none rounded-[var(--r)] text-white font-bold text-[0.85rem] cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(14,165,233,0.3)]"
              >
                Save Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
