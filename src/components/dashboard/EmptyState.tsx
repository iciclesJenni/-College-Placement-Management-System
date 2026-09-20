import { FileText, Users, Building2, type LucideIcon } from "lucide-react";

type EmptyStateIcon = "file" | "users" | "building" | typeof FileText;

const ICONS: Record<string, LucideIcon> = {
  file: FileText,
  users: Users,
  building: Building2,
};

interface EmptyStateProps {
  icon?: EmptyStateIcon | LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Standardized empty state block — centered icon, helper text, optional action. */
export function EmptyState({
  icon = "file",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = typeof icon === "string" ? (ICONS[icon] ?? FileText) : icon;

  return (
    <div className="py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <p className="font-bold text-slate-100 text-sm mb-1">{title}</p>
      <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="nb-btn-primary text-xs font-bold px-4 py-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
