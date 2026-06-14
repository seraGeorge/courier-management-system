"use client";

import { BagResponse } from "@shared/types/bag";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  OPEN: { bg: "bg-gray-100", text: "text-gray-700", label: "Open" },
  SEALED: { bg: "bg-blue-50", text: "text-blue-700", label: "Sealed" },
  LOADED: { bg: "bg-blue-50", text: "text-blue-700", label: "Loaded" },
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

interface BagTableProps {
  bags: BagResponse[];
}

export default function BagTable({ bags }: BagTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Bag Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Packages
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Created At
            </th>
          </tr>
        </thead>
        <tbody>
          {bags.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No bags found
              </td>
            </tr>
          ) : (
            bags.map((bag) => (
              <tr
                key={bag.bagNumber}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {bag.bagNumber}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={bag.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {bag._count?.packages ?? 0}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(bag.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
