"use client";

import { PackageResponse } from "@shared/types";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  TO_BE_PICKED_UP: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: "Awaiting Pickup",
  },
  PICKED_UP: { bg: "bg-blue-50", text: "text-blue-700", label: "Picked Up" },
  ADDED_TO_BAG: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Added to Bag",
  },
  EN_ROUTE: { bg: "bg-blue-50", text: "text-blue-700", label: "En Route" },
  ARRIVED_AT_REGION: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Arrived",
  },
  SCHEDULED_FOR_DELIVERY: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Scheduled",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Out for Delivery",
  },
  DELIVERED: { bg: "bg-blue-50", text: "text-blue-700", label: "Delivered" },
  DELAYED: { bg: "bg-red-50", text: "text-red-600", label: "Delayed" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
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

interface PackageTableProps {
  packages: PackageResponse[];
}

export default function PackageTable({ packages }: PackageTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Tracking ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Sender
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Receiver
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No packages found
              </td>
            </tr>
          ) : (
            packages.map((pkg) => (
              <tr
                key={pkg.trackingId}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {pkg.trackingId}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {pkg.senderName}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {pkg.receiverName}
                </td>
                <td className="px-4 py-3 text-gray-600">{pkg.region.name}</td>
                <td className="px-4 py-3">
                  <StatusPill status={pkg.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
