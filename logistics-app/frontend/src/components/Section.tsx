// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  count,
  children,
  action,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {count}{" "}
            {count === 1 ? "package" : count === 0 ? "packages" : "packages"}
          </span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default Section;