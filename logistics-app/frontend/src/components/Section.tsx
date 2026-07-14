function Section({
  title,
  count,
  children,
  action,
  itemLabel = "item",
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  action?: React.ReactNode;
  itemLabel?: string;
}) {
  const plural = count === 1 ? itemLabel : `${itemLabel}s`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-800 text-base">{title}</h2>
          <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-semibold">
            {count} {plural}
          </span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default Section;