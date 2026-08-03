"use client";

import { useState, useEffect } from "react";
import { BagResponse } from "@shared/types/bag";
import { TruckResponse } from "@shared/types/truck";
import { getTrucks } from "@/services/truck";

const BAG_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  OPEN: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    label: "Open",
  },
  SEALED: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
    label: "Sealed",
  },
  LOADED: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Loaded",
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

function StatusPill({ status }: { status: string }) {
  const s = BAG_STATUS_STYLES[status] ?? {
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

interface BagDispatchTableProps {
  bags: BagResponse[];
  onLoadToTruck: (bagNumber: string, truckNumber: string) => Promise<void>;
  onSealBag: (bagNumber: string) => Promise<void>;
}

async function fetchTrucks() {
  const res = await getTrucks();
  return res.data.filter(
    (t: TruckResponse) => t.status === "SCHEDULED" || t.status === "LOADED",
  );
}

export default function BagDispatchTable({
  bags,
  onLoadToTruck,
  onSealBag,
}: BagDispatchTableProps) {
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTrucks().then(setTrucks);
  }, []);

  async function handleLoad(bagNumber: string) {
    const truckNumber = selected[bagNumber];
    if (!truckNumber) return;
    setLoading((prev) => ({ ...prev, [bagNumber]: true }));
    try {
      await onLoadToTruck(bagNumber, truckNumber);
      await fetchTrucks().then(setTrucks);
    } finally {
      setLoading((prev) => ({ ...prev, [bagNumber]: false }));
    }
  }

  async function handleSeal(bagNumber: string) {
    setLoading((prev) => ({ ...prev, [bagNumber]: true }));
    try {
      await onSealBag(bagNumber);
    } finally {
      setLoading((prev) => ({ ...prev, [bagNumber]: false }));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bag Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Packages In Bag
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assign Truck
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {bags.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-sm text-slate-400"
              >
                No bags found
              </td>
            </tr>
          ) : (
            bags.map((bag) => {
              const isOpen = bag.status === "OPEN";
              const isSealed = bag.status === "SEALED";
              const isLoaded = bag.status === "LOADED";
              const isInTransit = bag.status === "IN_TRANSIT";
              const isArrived = bag.status === "ARRIVED";
              const isDelayed = bag.status === "DELAYED";
              const pkgCount = bag.packages?.length ?? 0;
              return (
                <tr
                  key={bag.bagNumber}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Bag number */}
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 font-medium">
                    {bag.bagNumber}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusPill status={bag.status} />
                  </td>
                  {/* Packages */}
                  <td className="px-4 py-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                          {pkgCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {pkgCount === 1 ? "package" : "packages"}
                        </span>
                      </div>
                      {pkgCount > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bag.packages?.map((pkg) => (
                            <span
                              key={pkg.trackingId}
                              className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600"
                            >
                              {pkg.trackingId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Truck selector */}
                  <td className="px-4 py-3.5">
                    {isOpen && (
                      <span className="text-xs text-slate-400 italic">
                        Seal bag first
                      </span>
                    )}
                    {isDelayed && (
                      <div className="space-y-1">
                        <span className="text-xs text-red-500 font-medium">
                          Delayed
                        </span>
                        {bag.delayReason && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1 max-w-[200px]">
                            {bag.delayReason}
                          </p>
                        )}
                      </div>
                    )}
                    {isLoaded && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Waiting for departure
                      </span>
                    )}
                    {isInTransit && (
                      <span className="inline-flex items-center gap-1 text-xs text-sky-600 font-medium bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                        In Transit
                      </span>
                    )}
                    {isArrived && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        ✓ Arrived
                      </span>
                    )}
                    {isSealed &&
                      (trucks.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">
                          No trucks available
                        </span>
                      ) : (
                        <select
                          value={selected[bag.bagNumber] ?? ""}
                          onChange={(e) =>
                            setSelected((prev) => ({
                              ...prev,
                              [bag.bagNumber]: e.target.value,
                            }))
                          }
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          <option value="">Select truck…</option>
                          {trucks.map((t) => (
                            <option key={t.truckNumber} value={t.truckNumber}>
                              {t.truckNumber} ({t.truckBags.length} bags)
                            </option>
                          ))}
                        </select>
                      ))}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3.5">
                    {isOpen && (
                      <button
                        onClick={() => handleSeal(bag.bagNumber)}
                        disabled={pkgCount === 0 || loading[bag.bagNumber]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading[bag.bagNumber] ? "Sealing…" : "Seal Bag"}
                      </button>
                    )}
                    {isSealed && (
                      <button
                        onClick={() => handleLoad(bag.bagNumber)}
                        disabled={
                          !selected[bag.bagNumber] || loading[bag.bagNumber]
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading[bag.bagNumber] ? "Loading…" : "Load to Truck"}
                      </button>
                    )}
                    {isDelayed && (
                      <span className="text-xs text-red-500 font-medium italic">
                        Awaiting resolution
                      </span>
                    )}
                    {isInTransit && (
                      <span className="text-xs text-slate-400 italic">
                        In transit
                      </span>
                    )}
                    {isArrived && (
                      <span className="text-xs text-emerald-600 font-medium">
                        ✓ Delivered
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
