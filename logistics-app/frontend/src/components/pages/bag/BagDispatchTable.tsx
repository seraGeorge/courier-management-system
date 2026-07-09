"use client";

import { useState, useEffect } from "react";
import { BagResponse } from "@shared/types/bag";
import { TruckResponse } from "@shared/types/truck";
import { getTrucks } from "@/services/truck";

const BAG_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  OPEN: { bg: "bg-gray-100", text: "text-gray-700", label: "Open" },
  SEALED: { bg: "bg-blue-50", text: "text-blue-700", label: "Sealed" },
  IN_TRANSIT: { bg: "bg-blue-50", text: "text-blue-700", label: "In Transit" },
  ARRIVED: { bg: "bg-blue-50", text: "text-blue-700", label: "Arrived" },
  DELAYED: { bg: "bg-red-50", text: "text-red-600", label: "Delayed" },
};

function StatusPill({ status }: { status: string }) {
  const s = BAG_STATUS_STYLES[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${s.bg} ${s.text}`}
    >
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
  // per-row state: selected truck number
  const [selected, setSelected] = useState<Record<string, string>>({});
  // per-row loading state
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Bag Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Packages In Bag
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Assign Truck
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {bags.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm text-gray-400"
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
              return (
                <tr
                  key={bag.bagNumber}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* Bag number */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {bag.bagNumber}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusPill status={bag.status} />
                  </td>
                  {/* Package count */}
                  <td className="px-4 py-3 text-gray-400">
                    <div className="space-y-1">
                      <div className="text-xs font-medium">
                        {bag.packages?.length ?? 0} Packages
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {bag.packages?.map((pkg) => (
                          <span
                            key={pkg.trackingId}
                            className="px-2 py-1 rounded bg-gray-100 text-xs font-mono"
                          >
                            {pkg.trackingId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  {/* Truck selector */}
                  <td className="px-4 py-3">
                    {isOpen && (
                      <span className="text-xs text-gray-400">
                        Seal bag before loading
                      </span>
                    )}

                    {isDelayed && (
                      <span className="text-xs text-red-500">Delayed</span>
                    )}

                    {isLoaded && (
                      <span className="text-xs text-yellow-600">
                        Waiting For Departure
                      </span>
                    )}
                    {isInTransit && (
                      <span className="text-xs text-gray-400">In Transit</span>
                    )}

                    {isArrived && (
                      <span className="text-xs text-green-600">Arrived</span>
                    )}

                    {isSealed &&
                      (trucks.length === 0 ? (
                        <span className="text-xs text-gray-400">
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
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white min-w-[140px]"
                        >
                          <option value="">Select truck</option>

                          {trucks.map((t) => (
                            <option key={t.truckNumber} value={t.truckNumber}>
                              {t.truckNumber} ({t.truckBags.length} bags)
                            </option>
                          ))}
                        </select>
                      ))}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 ">
                    {isOpen && (
                      <button
                        onClick={() => handleSeal(bag.bagNumber)}
                        disabled={(bag.packages ?? [])?.length === 0}
                        className="px-3 py-1.5 text-xs rounded-md disabled:cursor-not-allowed disabled:bg-blue-400  bg-blue-600 text-white"
                      >
                        Seal Bag
                      </button>
                    )}

                    {isSealed && (
                      <button
                        onClick={() => handleLoad(bag.bagNumber)}
                        disabled={
                          !selected[bag.bagNumber] || loading[bag.bagNumber]
                        }
                        className="px-3 py-1.5 text-xs rounded-md bg-black text-white disabled:opacity-40"
                      >
                        {loading[bag.bagNumber]
                          ? "Loading..."
                          : "Load To Truck"}
                      </button>
                    )}

                    {isDelayed && (
                      <span className="text-xs text-red-500">
                        Awaiting Resolution
                      </span>
                    )}

                    {isInTransit && (
                      <span className="text-xs text-gray-500">In Transit</span>
                    )}

                    {isArrived && (
                      <span className="text-xs text-green-600">Arrived</span>
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
