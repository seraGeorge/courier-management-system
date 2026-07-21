import { Package } from "@/types/package";
import { PackageStatus } from "@/types/package-status";

interface PackageSectionProps {
  title: string;
  packages: Package[];
  showDelayReason?: boolean;
  onMarkDelivered?: (trackingId: string) => void;
  onStartDelivery?: (trackingId: string) => void;
}

const STATUS_META: Record<
  PackageStatus,
  { label: string; pill: string; dot: string }
> = {
  TO_BE_PICKED_UP: {
    label: "Awaiting Pickup",
    pill: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  PICKED_UP: {
    label: "Picked Up",
    pill: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "Processing",
    pill: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
  },
  IN_TRANSIT: {
    label: "In Transit",
    pill: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  SCHEDULED_FOR_DELIVERY: {
    label: "Scheduled for Delivery",
    pill: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    pill: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  },
  DELAYED: {
    label: "Delayed",
    pill: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  DELIVERED: {
    label: "Delivered",
    pill: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
};

export default function PackageSection({
  title,
  packages,
  showDelayReason = false,
  onMarkDelivered,
  onStartDelivery,
}: PackageSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <span className="text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full font-semibold">
          {packages.length} package{packages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {packages.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-400">
          No packages in this section
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {packages.map((pkg) => {
            const meta = STATUS_META[pkg.status] ?? {
              label: pkg.status,
              pill: "bg-slate-100 text-slate-700",
              dot: "bg-slate-400",
            };

            return (
              <div
                key={pkg.trackingId}
                className="px-6 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-xs font-mono text-slate-400 truncate">
                      {pkg.trackingId}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        <span className="text-slate-400">From </span>
                        <span className="font-semibold text-slate-800">
                          {pkg.senderName}
                        </span>
                      </span>
                      <span className="text-slate-300">→</span>
                      <span>
                        <span className="text-slate-400">To </span>
                        <span className="font-semibold text-slate-800">
                          {pkg.receiverName}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {pkg.region.name}
                      </span>
                      <span>·</span>
                      <span>{pkg.weight} kg</span>
                      <span>·</span>
                      <span>
                        {new Date(pkg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {showDelayReason && pkg.delayReason && (
                      <div className="mt-2 text-xs bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                        <span>⚠</span>
                        <span>{pkg.delayReason}</span>
                      </div>
                    )}
                  </div>
                  {pkg.status === "SCHEDULED_FOR_DELIVERY" ? (
                    onStartDelivery && (
                      <button
                        onClick={() => onStartDelivery(pkg.trackingId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold transition-colors shadow-sm"
                      >
                        Start Delivery
                      </button>
                    )
                  ) : pkg.status === "OUT_FOR_DELIVERY" ? (
                    onMarkDelivered && (
                      <button
                        onClick={() => onMarkDelivered(pkg.trackingId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold transition-colors shadow-sm"
                      >
                        Mark Delivered
                      </button>
                    )
                  ) : (
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${meta.pill}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`}
                      />
                      {meta.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
