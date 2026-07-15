interface DashboardCardProps {
  title: string;
  count: number;
  variant?: "default" | "active" | "delayed" | "delivered";
  description?: string;
  icon?: React.ReactNode;
}

const VARIANTS: Record<
  NonNullable<DashboardCardProps["variant"]>,
  {
    card: string;
    label: string;
    value: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  default: {
    card: "bg-white border-slate-200",
    label: "text-slate-500",
    value: "text-slate-800",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
  },
  active: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
    label: "text-blue-600",
    value: "text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  delayed: {
    card: "bg-gradient-to-br from-red-50 to-rose-50 border-red-100",
    label: "text-red-600",
    value: "text-red-700",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  delivered: {
    card: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
    label: "text-emerald-600",
    value: "text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
};

export default function DashboardCard({
  title,
  count,
  variant = "default",
  description,
  icon,
}: DashboardCardProps) {
  const styles = VARIANTS[variant];

  return (
    <div
      className={`rounded-2xl border px-5 py-5 relative overflow-hidden shadow-sm ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wider mb-2 ${styles.label}`}
          >
            {title}
          </p>
          <p className={`text-4xl font-bold leading-none ${styles.value}`}>
            {count}
          </p>
          {description && (
            <p className={`text-xs mt-2 ${styles.label} opacity-80`}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
          >
            <span className={styles.iconColor}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
