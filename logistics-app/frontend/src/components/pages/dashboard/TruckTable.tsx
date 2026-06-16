"use client";

import { TruckResponse } from "@shared/types/truck";
import { useState } from "react";
import { STATUS_STYLES } from "./BagTable";

const TRUCK_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  SCHEDULED: { bg: "bg-gray-100", text: "text-gray-700", label: "Scheduled" },
  LOADING: { bg: "bg-blue-50", text: "text-blue-700", label: "Loading" },
  IN_TRANSIT: { bg: "bg-blue-50", text: "text-blue-700", label: "In Transit" },
  ARRIVED: { bg: "bg-blue-50", text: "text-blue-700", label: "Arrived" },
  DELAYED: { bg: "bg-red-50", text: "text-red-600", label: "Delayed" },
};
function StatusPill({
  status,
  map,
}: {
  status: string;
  map: Record<string, { bg: string; text: string; label: string }>;
}) {
  const s = map[status] ?? {
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

interface TrucksTableProps {
  trucks: TruckResponse[];
  onUpdateTruckStatus?: (
    truckNumber: string,
    status: "DEPARTED" | "ARRIVED" | "DELAYED",
  ) => Promise<void>;
  noActions?: boolean;
}

export default function TrucksTable({
  trucks,
  onUpdateTruckStatus,
  noActions,
}: TrucksTableProps) {
  const [loading, setLoading] = useState<boolean>(false);

  async function handleTruckStatus(
    truckNumber: string,
    status: "DEPARTED" | "ARRIVED" | "DELAYED",
  ) {
    setLoading(true);
    try {
      await onUpdateTruckStatus?.(truckNumber, status);
    } finally {
      setLoading(false);
    }
  }

  if (trucks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
        No active trucks found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trucks.map((truck) => (
        <div
          key={truck.truckNumber}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* Truck header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium text-gray-900">
                {truck.truckNumber}
              </span>
              <StatusPill status={truck.status} map={TRUCK_STATUS_STYLES} />
            </div>
            <span className="text-xs text-gray-400">
              {truck.truckBags?.length ?? 0}{" "}
              {truck.truckBags?.length === 1 ? "bag" : "bags"}
            </span>
            {/* Action */}
            {!noActions && (
              <>
                {truck.status === "LOADED" && (
                  <button
                    onClick={() =>
                      handleTruckStatus(truck.truckNumber, "DEPARTED")
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-black text-white"
                  >
                    {loading ? "Updating..." : "Depart Truck"}
                  </button>
                )}

                {truck.status === "DEPARTED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleTruckStatus(truck.truckNumber, "ARRIVED")
                      }
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white"
                    >
                      Arrived
                    </button>

                    <button
                      onClick={() =>
                        handleTruckStatus(truck.truckNumber, "DELAYED")
                      }
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white"
                    >
                      Delay
                    </button>
                  </div>
                )}

                {truck.status === "ARRIVED" && (
                  <span className="text-xs text-green-600">Trip Completed</span>
                )}

                {truck.status === "DELAYED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleTruckStatus(truck.truckNumber, "ARRIVED")
                      }
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white"
                    >
                      Mark as Arrived
                    </button>
                    <button
                      onClick={() =>
                        handleTruckStatus(truck.truckNumber, "DEPARTED")
                      }
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600  text-white"
                    >
                      Resume Journey
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bags table */}
          {truck.truckBags?.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No bags loaded
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Bag Number
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Bag Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Packages
                  </th>
                </tr>
              </thead>
              <tbody>
                {truck.truckBags?.map(({ bag }) => {
                  const key = `${truck.truckNumber}-${bag.bagNumber}`;
                  return (
                    <tr
                      key={bag.bagNumber}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      {/* Bag number */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {bag.bagNumber}
                      </td>
                      {/* Bag status */}
                      <td className="px-4 py-3">
                        <StatusPill status={bag.status} map={STATUS_STYLES} />
                      </td>
                      {/* Package tracking IDs */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {bag.packages?.length === 0 ? (
                            <span className="text-xs text-gray-400">
                              No packages
                            </span>
                          ) : (
                            bag.packages?.map((pkg) => (
                              <span
                                key={pkg.trackingId}
                                className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                              >
                                {pkg.trackingId}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
