// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "blue" | "red";
}) {
  const styles = {
    default: "bg-white border-gray-200 text-gray-900",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    red: "bg-red-50 border-red-100 text-red-600",
  };
  return (
    <div className={`rounded-xl border px-5 py-4 ${styles[variant]}`}>
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p
        className={`text-3xl font-bold ${variant === "blue" ? "text-blue-700" : variant === "red" ? "text-red-600" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default MetricCard;