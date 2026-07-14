const variantStyles = {
  default: {
    card: "bg-white border-slate-200",
    label: "text-slate-500",
    value: "text-slate-800",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
    label: "text-blue-600",
    value: "text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-rose-50 border-red-100",
    label: "text-red-500",
    value: "text-red-600",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
    label: "text-emerald-600",
    value: "text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100",
    label: "text-amber-600",
    value: "text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
};

function MetricCard({
  label,
  value,
  variant = "default",
  icon,
  description,
}: {
  label: string;
  value: number;
  variant?: "default" | "blue" | "red" | "green" | "amber";
  icon?: React.ReactNode;
  description?: string;
}) {
  const styles = variantStyles[variant];
  return (
    <div
      className={`rounded-2xl border px-5 py-5 ${styles.card} relative overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wider mb-2 ${styles.label}`}
          >
            {label}
          </p>
          <p className={`text-4xl font-bold leading-none ${styles.value}`}>
            {value}
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

export default MetricCard;