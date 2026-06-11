interface DashboardCardProps {
  title: string;
  count: number;
  variant?: "default" | "active" | "delayed";
};

const VARIANTS = {
  default: "bg-white border-gray-200 text-gray-900",
  active: "bg-blue-50 border-blue-200 text-blue-900",
  delayed: "bg-red-50 border-red-200 text-red-900",
};

const COUNT_VARIANTS = {
  default: "text-gray-900",
  active: "text-blue-700",
  delayed: "text-red-700",
};

export default function DashboardCard({
  title,
  count,
  variant = "default",
}: DashboardCardProps) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm ${VARIANTS[variant]}`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-3 text-4xl font-bold ${COUNT_VARIANTS[variant]}`}>
        {count}
      </p>
    </div>
  );
}
