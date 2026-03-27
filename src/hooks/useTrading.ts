import { useState, useEffect, useCallback } from 'react';
import { Instrument, Trade, Profile, ProfilesMeta, ProfileData, AssetType, Reflection, Lesson } from '../types';
import { DB, PROFILE_COLORS } from '../constants';
import { format } from 'date-fns';

const PROFILES_META_KEY = 'ec2_profiles_meta';
const PROFILE_KEY_PREFIX = 'ec2_profile_';

export function useTrading() {
  const [meta, setMeta] = useState<ProfilesMeta>(() => {
    const saved = localStorage.getItem(PROFILES_META_KEY);
    if (saved) return JSON.parse(saved);
    const defaultId = 'prof_' + Date.now();
    return {
      currentId: defaultId,
      profiles: [{
        id: defaultId,
        name: 'My Account',
        color: PROFILE_COLORS[0],
        createdAt: Date.now(),
      }]
    };
  });

  const [currentProfileId, setCurrentProfileId] = useState(meta.currentId);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const saved = localStorage.getItem(PROFILE_KEY_PREFIX + meta.currentId);
    const defaults: ProfileData = {
      trades: [],
      initialBalance: 25000,
      riskPct: '1',
      winRate: '55',
      customInstruments: [],
      strategies: ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalping'],
      reflections: [],
      lessons: [],
      dailyIntention: ''
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem(PROFILES_META_KEY, JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY_PREFIX + currentProfileId, JSON.stringify(profileData));
  }, [currentProfileId, profileData]);

  const switchProfile = useCallback((pid: string) => {
    setMeta(prev => ({ ...prev, currentId: pid }));
    setCurrentProfileId(pid);
    const saved = localStorage.getItem(PROFILE_KEY_PREFIX + pid);
    const defaults: ProfileData = {
      trades: [],
      initialBalance: 25000,
      riskPct: '1',
      winRate: '55',
      customInstruments: [],
      strategies: ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalping'],
      reflections: [],
      lessons: [],
      dailyIntention: ''
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfileData({ ...defaults, ...parsed });
    } else {
      setProfileData(defaults);
    }
  }, []);

  const createProfile = (name: string, balance: number, color: string) => {
    const pid = 'prof_' + Date.now();
    const newProfile: Profile = { id: pid, name, color, createdAt: Date.now() };
    setMeta(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile]
    }));
    const newData: ProfileData = {
      trades: [],
      initialBalance: balance,
      riskPct: '1',
      winRate: '55',
      customInstruments: [],
      strategies: ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalping'],
      reflections: [],
      lessons: [],
      dailyIntention: ''
    };
    localStorage.setItem(PROFILE_KEY_PREFIX + pid, JSON.stringify(newData));
    switchProfile(pid);
  };

  const deleteProfile = (pid: string) => {
    if (meta.profiles.length <= 1) return;
    setMeta(prev => {
      const newProfiles = prev.profiles.filter(p => p.id !== pid);
      const nextId = prev.currentId === pid ? newProfiles[0].id : prev.currentId;
      return { currentId: nextId, profiles: newProfiles };
    });
    localStorage.removeItem(PROFILE_KEY_PREFIX + pid);
    if (currentProfileId === pid) {
      const nextId = meta.profiles.find(p => p.id !== pid)!.id;
      switchProfile(nextId);
    }
  };

  const addTrade = (trade: Omit<Trade, 'id'>) => {
    const newTrade: Trade = { ...trade, id: Date.now() };
    setProfileData(prev => ({
      ...prev,
      trades: [...prev.trades, newTrade]
    }));
  };

  const deleteTrade = (id: number) => {
    setProfileData(prev => ({
      ...prev,
      trades: prev.trades.filter(t => t.id !== id)
    }));
  };

  const clearAllTrades = () => {
    setProfileData(prev => ({ ...prev, trades: [] }));
  };

  const updateInitialBalance = (balance: number) => {
    setProfileData(prev => ({ ...prev, initialBalance: balance }));
  };

  const addCustomInstrument = (inst: Instrument) => {
    setProfileData(prev => ({
      ...prev,
      customInstruments: [...prev.customInstruments, inst]
    }));
  };

  const deleteCustomInstrument = (ticker: string) => {
    setProfileData(prev => ({
      ...prev,
      customInstruments: prev.customInstruments.filter(i => i.ticker !== ticker)
    }));
  };

  const addStrategy = (strategy: string) => {
    if (!profileData.strategies.includes(strategy)) {
      setProfileData(prev => ({
        ...prev,
        strategies: [...prev.strategies, strategy]
      }));
    }
  };

  const deleteStrategy = (strategy: string) => {
    setProfileData(prev => ({
      ...prev,
      strategies: prev.strategies.filter(s => s !== strategy)
    }));
  };

  const exportData = () => {
    const allData: Record<string, any> = {
      meta: meta,
    };
    meta.profiles.forEach(p => {
      const data = localStorage.getItem(PROFILE_KEY_PREFIX + p.id);
      if (data) allData[PROFILE_KEY_PREFIX + p.id] = JSON.parse(data);
    });
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dst-trading-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (data: any) => {
    try {
      if (!data.meta || !data.meta.profiles) throw new Error("Invalid backup file");
      
      localStorage.setItem(PROFILES_META_KEY, JSON.stringify(data.meta));
      Object.keys(data).forEach(key => {
        if (key.startsWith(PROFILE_KEY_PREFIX)) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });
      
      window.location.reload(); // Simplest way to re-sync everything
    } catch (e) {
      console.error("Import failed", e);
      alert("Failed to import data. Please ensure the file is a valid backup.");
    }
  };

  const currentProfile = meta.profiles.find(p => p.id === currentProfileId) || meta.profiles[0];

  const realizedPnl = profileData.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const liveBalance = profileData.initialBalance + realizedPnl;

  return {
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
    deleteCustomInstrument,
    addStrategy,
    deleteStrategy,
    exportData,
    importData,
    setProfileData,
    updateWinRate: (wr: string) => setProfileData(prev => ({ ...prev, winRate: wr })),
    updateRiskPct: (rp: string) => setProfileData(prev => ({ ...prev, riskPct: rp })),
    exportCSV: () => {
      const trades = profileData.trades;
      if (trades.length === 0) {
        alert("No trades to export");
        return;
      }

      const headers = ["ID", "Date", "Pair", "Direction", "Entry", "Stop Loss", "Take Profit", "RRR", "Result", "PnL", "Strategy", "Notes", "Tags"];
      const rows = trades.map(t => [
        t.id,
        t.date,
        t.pair,
        t.dir,
        t.entry,
        t.sl,
        t.tp,
        t.rrr.toFixed(2),
        t.result,
        t.pnl.toFixed(2),
        t.strategy || "",
        `"${(t.notes || "").replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(', ')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-export-${currentProfile.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importCSV: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter(l => l.trim() !== "");
          if (lines.length < 2) throw new Error("File is empty or invalid");

          const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
          const newTrades: Trade[] = [];

          for (let i = 1; i < lines.length; i++) {
            const row: string[] = [];
            let current = "";
            let inQuotes = false;
            for (let char of lines[i]) {
              if (char === '"') inQuotes = !inQuotes;
              else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            row.push(current.trim());

            const t: any = {};
            headers.forEach((h, idx) => {
              const val = row[idx];
              if (h === 'id') t.id = parseInt(val) || Date.now() + i;
              if (h === 'date') t.date = val;
              if (h === 'pair') t.pair = val;
              if (h === 'direction' || h === 'dir') t.dir = val.toUpperCase();
              if (h === 'entry') t.entry = parseFloat(val) || 0;
              if (h === 'stop loss' || h === 'sl') t.sl = parseFloat(val) || 0;
              if (h === 'take profit' || h === 'tp') t.tp = parseFloat(val) || 0;
              if (h === 'rrr') t.rrr = parseFloat(val) || 0;
              if (h === 'result') t.result = val.toUpperCase();
              if (h === 'pnl') t.pnl = parseFloat(val) || 0;
              if (h === 'strategy') t.strategy = val;
              if (h === 'notes') t.notes = val.replace(/^"|"$/g, '').replace(/""/g, '"');
              if (h === 'tags') t.tags = val.replace(/^"|"$/g, '').split(',').map(s => s.trim()).filter(s => s !== "");
            });

            if (t.date && t.pair) {
              newTrades.push({
                id: t.id || Date.now() + i,
                date: t.date,
                pair: t.pair,
                dir: t.dir as any,
                entry: t.entry,
                sl: t.sl,
                tp: t.tp,
                rrr: t.rrr,
                result: t.result as any,
                pnl: t.pnl,
                notes: t.notes || "",
                imgs: [],
                strategy: t.strategy || "",
                tags: t.tags || []
              });
            }
          }

          if (newTrades.length > 0) {
            if (confirm(`Import ${newTrades.length} trades? This will merge with your existing trades.`)) {
              setProfileData(prev => {
                const existingIds = new Set(prev.trades.map(t => t.id));
                const uniqueNewTrades = newTrades.filter(t => !existingIds.has(t.id));
                return {
                  ...prev,
                  trades: [...prev.trades, ...uniqueNewTrades]
                };
              });
            }
          } else {
            alert("No valid trades found in CSV");
          }
        } catch (err) {
          console.error(err);
          alert("Failed to parse CSV. Please check the format.");
        }
      };
      reader.readAsText(file);
    },
    addReflection: (reflection: Omit<Reflection, 'id'>) => {
      setProfileData(prev => ({
        ...prev,
        reflections: [{ ...reflection, id: Date.now() }, ...prev.reflections]
      }));
    },
    deleteReflection: (id: number) => {
      setProfileData(prev => ({
        ...prev,
        reflections: prev.reflections.filter(r => r.id !== id)
      }));
    },
    updateReflection: (id: number, reflection: Partial<Reflection>) => {
      setProfileData(prev => ({
        ...prev,
        reflections: prev.reflections.map(r => r.id === id ? { ...r, ...reflection } : r)
      }));
    },
    addLesson: (text: string) => {
      setProfileData(prev => ({
        ...prev,
        lessons: [...prev.lessons, { id: Date.now(), text, isCompleted: false }]
      }));
    },
    deleteLesson: (id: number) => {
      setProfileData(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== id)
      }));
    },
    toggleLesson: (id: number) => {
      setProfileData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => l.id === id ? { ...l, isCompleted: !l.isCompleted } : l)
      }));
    },
    updateDailyIntention: (text: string) => {
      setProfileData(prev => ({ ...prev, dailyIntention: text }));
    }
  };
}
