"use client";

import { PackageResponse } from "@shared/types/package";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  TO_BE_PICKED_UP: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    label: "Awaiting Pickup",
  },
  PICKED_UP: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
    label: "Picked Up",
  },
  ADDED_TO_BAG: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
    label: "In Bag",
  },
  EN_ROUTE: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "En Route",
  },
  ARRIVED_AT_REGION: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    dot: "bg-teal-500",
    label: "Arrived",
  },
  SCHEDULED_FOR_DELIVERY: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    label: "Scheduled",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Out for Delivery",
  },
  DELIVERED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Delivered",
  },
  DELAYED: {
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Delayed",
  },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
      {s.label}
    </span>
  );
}

interface PackageTableProps {
  packages: PackageResponse[];
  onAssign?: (pkg: PackageResponse) => void;
  scheduleForDelivery?: (pkg: PackageResponse) => void;
  noActions?: boolean;
  showDeliveredInfo?: boolean;
}

export default function PackageTable({
  packages,
  onAssign,
  scheduleForDelivery,
  noActions,
  showDeliveredInfo,
}: PackageTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tracking ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sender
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receiver
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Weight
            </th>
            {showDeliveredInfo && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Delivered
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            {!noActions && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 ? (
            <tr>
              <td
                colSpan={noActions ? 6 : 7}
                className="px-4 py-12 text-center text-sm text-slate-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span>No packages found</span>
                </div>
              </td>
            </tr>
          ) : (
            packages.map((pkg) => (
              <tr
                key={pkg.trackingId}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
              >
                <td className="px-4 py-3.5 font-mono text-xs text-slate-400 font-medium">
                  {pkg.trackingId}
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">
                  {pkg.senderName}
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">
                  {pkg.receiverName}
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {pkg.region.name}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">
                  {pkg.weight ?? "—"}{pkg.weight ? " kg" : ""}
                </td>
                {showDeliveredInfo && (
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {pkg.updatedAt
                      ? new Date(pkg.updatedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <StatusPill status={pkg.status} />
                </td>
                {!noActions && (
                  <td className="px-4 py-3.5">
                    {pkg.status !== "ARRIVED_AT_REGION" && onAssign && (
                      <button
                        onClick={() => onAssign(pkg)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                      >
                        Assign to Bag
                      </button>
                    )}
                    {pkg.status === "ARRIVED_AT_REGION" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onAssign?.(pkg)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                        >
                          Reassign Bag
                        </button>
                        <button
                          onClick={() => scheduleForDelivery?.(pkg)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                        >
                          Schedule Delivery
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
