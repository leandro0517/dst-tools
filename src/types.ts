export type AssetType = 'futures' | 'forex' | 'spot';

export interface Instrument {
  ticker: string;
  name: string;
  cat: string;
  type: AssetType;
  dpp: number;
  tick: number;
  dpt?: number;
  dec?: number;
  pipVal?: number;
}

export type TradeResult = 'WIN' | 'LOSS' | 'BE';
export type TradeDirection = 'LONG' | 'SHORT';

export interface Trade {
  id: number;
  date: string;
  pair: string;
  dir: TradeDirection;
  entry: number;
  sl: number;
  tp: number;
  rrr: number;
  result: TradeResult;
  pnl: number;
  notes: string;
  imgs: string[];
  img?: string | null;
  strategy?: string;
  tags?: string[];
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Reflection {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: string;
  book?: string;
}

export interface Lesson {
  id: number;
  text: string;
  isCompleted: boolean;
}

export interface ProfileData {
  trades: Trade[];
  initialBalance: number;
  riskPct: string;
  winRate: string;
  customInstruments: Instrument[];
  strategies: string[];
  reflections: Reflection[];
  lessons: Lesson[];
  dailyIntention?: string;
}

export interface ProfilesMeta {
  currentId: string;
  profiles: Profile[];
}
