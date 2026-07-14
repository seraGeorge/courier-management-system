"use client";

import { BagStatus } from "@shared/enums/bag";
import { BagResponse } from "@shared/types/bag";

export const STATUS_STYLES: Record<
  BagStatus,
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

function StatusPill({ status }: { status: BagStatus }) {
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

interface BagTableProps {
  bags: BagResponse[];
}

export default function BagTable({ bags }: BagTableProps) {
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
              Packages
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Created At
            </th>
          </tr>
        </thead>
        <tbody>
          {bags.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-12 text-center text-sm text-slate-400"
              >
                No bags found
              </td>
            </tr>
          ) : (
            bags.map((bag) => (
              <tr
                key={bag.bagNumber}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
              >
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500 font-medium">
                  {bag.bagNumber}
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill status={bag.status} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                    {bag._count?.packages ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">
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
