"use client";

import { TruckResponse } from "@shared/types/truck";
import { useState } from "react";
import { STATUS_STYLES } from "./BagTable";

const TRUCK_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  SCHEDULED: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    label: "Scheduled",
  },
  LOADING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Loading",
  },
  LOADED: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Loaded",
  },
  DEPARTED: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
    label: "Departed",
  },
  IN_TRANSIT: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
    label: "In Transit",
  },
  ARRIVED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Arrived",
  },
  DELAYED: {
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Delayed",
  },
};

function StatusPill({
  status,
  map,
}: {
  status: string;
  map: Record<string, { bg: string; text: string; dot: string; label: string }>;
}) {
  const s = map[status] ?? {
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

interface TrucksTableProps {
  trucks: TruckResponse[];
  onUpdateTruckStatus?: (
    truckNumber: string,
    status: "DEPARTED" | "ARRIVED" | "DELAYED",
    delayReason?: string,
  ) => Promise<void>;
  noActions?: boolean;
}

export default function TrucksTable({
  trucks,
  onUpdateTruckStatus,
  noActions,
}: TrucksTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [delayingTruck, setDelayingTruck] = useState<string | null>(null);
  const [delayReason, setDelayReason] = useState("");

  async function handleTruckStatus(
    truckNumber: string,
    status: "DEPARTED" | "ARRIVED" | "DELAYED",
    reason?: string,
  ) {
    setLoading(true);
    try {
      await onUpdateTruckStatus?.(truckNumber, status, reason);
      setDelayingTruck(null);
      setDelayReason("");
    } finally {
      setLoading(false);
    }
  }

  function startDelay(truckNumber: string) {
    setDelayingTruck(truckNumber);
    setDelayReason("");
  }

  function cancelDelay() {
    setDelayingTruck(null);
    setDelayReason("");
  }

  if (trucks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-12 text-center">
        <svg
          className="w-10 h-10 text-slate-300 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <p className="text-sm text-slate-400">No active trucks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trucks.map((truck) => {
        const totalPackages =
          truck.truckBags?.reduce(
            (sum, { bag }) => sum + (bag.packages?.length ?? 0),
            0,
          ) ?? 0;
        const isEnteringDelay = delayingTruck === truck.truckNumber;

        return (
          <div
            key={truck.truckNumber}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          >
            {/* Truck header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                {/* Truck icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="3" width="15" height="13" rx="1" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    {truck.truckNumber}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {truck.truckBags?.length ?? 0}{" "}
                    {(truck.truckBags?.length ?? 0) === 1 ? "bag" : "bags"} ·{" "}
                    {totalPackages}{" "}
                    {totalPackages === 1 ? "package" : "packages"}
                  </span>
                </div>
                <StatusPill status={truck.status} map={TRUCK_STATUS_STYLES} />
              </div>

              {/* Actions */}
              {!noActions && (
                <div className="flex items-center gap-2">
                  {truck.status === "LOADED" && (
                    <button
                      onClick={() =>
                        handleTruckStatus(truck.truckNumber, "DEPARTED")
                      }
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-60"
                    >
                      🚛 Depart Truck
                    </button>
                  )}

                  {truck.status === "DEPARTED" && !isEnteringDelay && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleTruckStatus(truck.truckNumber, "ARRIVED")
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-60"
                      >
                        ✓ Mark Arrived
                      </button>
                      <button
                        onClick={() => startDelay(truck.truckNumber)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm disabled:opacity-60"
                      >
                        ⚠ Mark Delayed
                      </button>
                    </div>
                  )}

                  {truck.status === "ARRIVED" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Trip Completed
                    </span>
                  )}

                  {truck.status === "DELAYED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleTruckStatus(truck.truckNumber, "ARRIVED")
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-60"
                      >
                        ✓ Mark Arrived
                      </button>
                      <button
                        onClick={() =>
                          handleTruckStatus(truck.truckNumber, "DEPARTED")
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-60"
                      >
                        ↺ Resume Journey
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEnteringDelay && (
              <div className="px-5 py-4 border-b border-red-100 bg-red-50/60">
                <label
                  htmlFor={`delay-reason-${truck.truckNumber}`}
                  className="block text-xs font-semibold text-red-700 mb-2"
                >
                  Delay reason
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id={`delay-reason-${truck.truckNumber}`}
                    type="text"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="e.g. Traffic congestion on NH-66"
                    className="flex-1 text-sm border border-red-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleTruckStatus(
                          truck.truckNumber,
                          "DELAYED",
                          delayReason.trim(),
                        )
                      }
                      disabled={loading || !delayReason.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm disabled:opacity-60"
                    >
                      Confirm Delay
                    </button>
                    <button
                      onClick={cancelDelay}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bags table */}
            {(truck.truckBags?.length ?? 0) === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No bags loaded
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Bag Number
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Packages
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {truck.truckBags?.map(({ bag }) => (
                    <tr
                      key={bag.bagNumber}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 font-medium">
                        {bag.bagNumber}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill
                          status={bag.status}
                          map={
                            STATUS_STYLES as Record<
                              string,
                              {
                                bg: string;
                                text: string;
                                dot: string;
                                label: string;
                              }
                            >
                          }
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(bag.packages?.length ?? 0) === 0 ? (
                            <span className="text-xs text-slate-400">
                              No packages
                            </span>
                          ) : (
                            bag.packages?.map((pkg) => (
                              <span
                                key={pkg.trackingId}
                                className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                              >
                                {pkg.trackingId}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
