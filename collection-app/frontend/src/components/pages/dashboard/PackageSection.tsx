import { Package } from "@/types/package";

interface PackageSectionProps {
  title: string;
  packages: Package[];
  showDelayReason?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  TO_BE_PICKED_UP: "Awaiting Pickup",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELAYED: "Delayed",
  DELIVERED: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  TO_BE_PICKED_UP: "bg-gray-100 text-gray-700",
  PICKED_UP: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-yellow-50 text-yellow-700",
  DELAYED: "bg-red-50 text-red-700",
  DELIVERED: "bg-green-50 text-green-700",
};

export default function PackageSection({
  title,
  packages,
  showDelayReason = false,
}: PackageSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {packages.length} package{packages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {packages.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          No packages in this section
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {packages.map((pkg) => (
            <div
              key={pkg.trackingId}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400 truncate">
                    {pkg.trackingId}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <span className="text-gray-400">From </span>
                      <span className="font-medium text-gray-800">
                        {pkg.senderName}
                      </span>
                    </span>
                    <span className="text-gray-300">→</span>
                    <span>
                      <span className="text-gray-400">To </span>
                      <span className="font-medium text-gray-800">
                        {pkg.receiverName}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{pkg.region.name}</span>
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
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[pkg.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {STATUS_LABELS[pkg.status] ?? pkg.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
