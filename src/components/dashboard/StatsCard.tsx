import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  /** Purple gradient metric treatment for primary KPIs */
  highlight?: boolean;
  /** Gold treatment for elite metrics — highest CTC, total offers, placed */
  gold?: boolean;
}

export function StatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = "text-primary",
  highlight = false,
  gold = false,
}: StatsCardProps) {
  const isGold = gold;

  return (
    <div
      className={`nb-card nb-card-hover p-5 transition-all duration-200 ${
        isGold
          ? "border-amber-500/30 bg-amber-500/5"
          : highlight
            ? "border-purple-500/40 bg-gradient-to-br from-purple-600/15 to-violet-800/10"
            : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="nb-label">{label}</span>
        <Icon
          className={`w-4 h-4 transition-all duration-200 ${
            isGold ? "text-amber-400" : color
          } ${isGold ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" : ""}`}
        />
      </div>
      <div
        className={`mt-2 text-2xl font-black tracking-tight ${
          isGold ? "nb-gold-text" : highlight ? "nb-gradient-text" : ""
        }`}
      >
        {value}
      </div>
      {subtitle && (
        <p
          className={`text-xs mt-1 font-bold ${
            isGold ? "text-amber-400/80" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
