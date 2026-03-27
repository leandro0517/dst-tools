import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { ReactNode } from "react";

interface NavTabProps {
  id: string;
  activeId: string;
  onClick: (id: string) => void;
  icon: LucideIcon;
  label: string;
}

export function NavTab({ id, activeId, onClick, icon: Icon, label }: NavTabProps) {
  const isActive = id === activeId;
  
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "relative px-4 h-[58px] bg-none border-none text-[var(--t2)] font-medium cursor-pointer flex items-center gap-1.5 border-b-2 border-transparent transition-all duration-150 outline-none tracking-tight hover:text-[var(--t0)] hover:bg-white/3",
        isActive && "text-[var(--sky2)] font-bold bg-[var(--sky)]/7"
      )}
    >
      <Icon size={15} className={cn("transition-transform duration-150", !isActive && "hover:scale-110")} />
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-linear-to-r from-[var(--sky)] to-[var(--up)] rounded-t" />
      )}
    </button>
  );
}

interface PanelProps {
  title: string;
  icon: ReactNode;
  iconClass?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  bodyClass?: string;
}

export function Panel({ title, icon, iconClass, subtitle, children, className, headerAction, bodyClass }: PanelProps) {
  return (
    <div className={cn("panel", className)}>
      <div className="panel-hd">
        <div className={cn("w-[26px] h-[26px] rounded-md flex items-center justify-center text-[0.82rem] shrink-0", iconClass)}>
          {icon}
        </div>
        <div className="text-[0.78rem] font-bold text-[var(--t0)] tracking-wider uppercase">{title}</div>
        {subtitle && <div className="text-[0.7rem] text-[var(--t2)] ml-auto">{subtitle}</div>}
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>
      <div className={cn("p-4", bodyClass)}>
        {children}
      </div>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'sky' | 'up' | 'dn' | 'gold' | 'violet' | 'teal';
}

export function MetricTile({ label, value, subValue, variant = 'sky' }: MetricTileProps) {
  const variantClasses = {
    sky: "before:bg-[var(--sky)]",
    up: "before:bg-[var(--up)]",
    dn: "before:bg-[var(--dn)]",
    gold: "before:bg-[var(--gold)]",
    violet: "before:bg-[var(--violet)]",
    teal: "before:bg-[var(--teal)]",
  };

  const textClasses = {
    sky: "text-[var(--sky2)]",
    up: "text-[var(--up)]",
    dn: "text-[var(--dn2)]",
    gold: "text-[var(--gold2)]",
    violet: "text-[var(--violet2)]",
    teal: "text-[var(--teal2)]",
  };

  return (
    <div className={cn(
      "bg-[var(--ink2)] p-3.5 flex flex-col gap-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:height-[2px]",
      variantClasses[variant]
    )}>
      <div className="text-[0.6rem] font-bold text-[var(--t2)] uppercase tracking-widest">{label}</div>
      <div className={cn("font-mono text-[1.28rem] font-bold leading-none tracking-tighter", textClasses[variant])}>
        {value}
      </div>
      {subValue && <div className="text-[0.66rem] text-[var(--t1)] font-mono">{subValue}</div>}
    </div>
  );
}
