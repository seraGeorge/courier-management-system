"use client";
import { getDashboard, updatePackageStatus } from "@/services/dashboard";
import DashboardCard from "./DashboardCard";
import PackageSection from "./PackageSection";
import { useEffect, useState } from "react";
import { DashboardData } from "@/types/dashboard";
import {
  PACKAGE_STATUS_FLOW,
  PACKAGE_STATUS_LABELS,
  PackageStatus,
} from "@/types/package-status";

const STATUS_GRAPH_COLORS: Record<PackageStatus, string> = {
  TO_BE_PICKED_UP: "bg-slate-500",
  PICKED_UP: "bg-blue-500",
  PROCESSING: "bg-cyan-500",
  IN_TRANSIT: "bg-amber-500",
  SCHEDULED_FOR_DELIVERY: "bg-violet-500",
  OUT_FOR_DELIVERY: "bg-indigo-500",
  DELAYED: "bg-red-500",
  DELIVERED: "bg-emerald-500",
};

const STATUS_SECTION_META: Record<
  PackageStatus,
  { title: string; showDelayReason?: boolean; allowMarkDelivered?: boolean }
> = {
  TO_BE_PICKED_UP: { title: "Packages Awaiting Pickup" },
  PICKED_UP: { title: "Picked Up Packages" },
  PROCESSING: { title: "Packages In Processing" },
  IN_TRANSIT: { title: "Packages In Transit" },
  SCHEDULED_FOR_DELIVERY: { title: "Packages Scheduled For Delivery" },
  OUT_FOR_DELIVERY: {
    title: "Out For Delivery Packages",
    allowMarkDelivered: true,
  },
  DELAYED: { title: "Delayed Packages", showDelayReason: true },
  DELIVERED: { title: "Delivered Packages" },
};

export default function DashboardPageContent() {
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await getDashboard();
      setDashboard(response.data ?? undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-sm text-red-600">
        Failed to load dashboard data.
      </div>
    );
  }

  const handleStartDelivery = async (trackingId: string) => {
    try {
      await updatePackageStatus(trackingId, 6);
      await fetchDashboard();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkDelivered = async (trackingId: string) => {
    try {
      await updatePackageStatus(trackingId, 7);
      await fetchDashboard();
    } catch (error) {
      console.error(error);
    }
  };

  const now = new Date();
  const timeString = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalPackages = dashboard.statusGraph.totalPackages;

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-8 py-7 shadow-lg">
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-14 -left-8 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-6">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Collection Dashboard
            </p>
            <h1 className="text-2xl font-bold text-white">
              Courier Collection Hub
            </h1>
            <p className="text-blue-200 text-sm mt-1">{dateString}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-white tabular-nums">
              {timeString}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-medium">
                API Live
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-4 gap-3">
          {[
            { label: "Total Packages", value: totalPackages },
            {
              label: "In Movement",
              value:
                dashboard.statusSections.PICKED_UP.count +
                dashboard.statusSections.PROCESSING.count +
                dashboard.statusSections.IN_TRANSIT.count,
            },
            {
              label: "Out for Delivery",
              value: dashboard.outForDeliveryPackages.count,
            },
            { label: "Delivered", value: dashboard.deliveredPackages.count },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
            >
              <p className="text-blue-200 text-xs font-medium">{label}</p>
              <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Awaiting Pickup"
          count={dashboard.statusSections.TO_BE_PICKED_UP.count}
          description="Pending collection"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <DashboardCard
          title="Actively Moving"
          count={
            dashboard.statusSections.PICKED_UP.count +
            dashboard.statusSections.PROCESSING.count +
            dashboard.statusSections.IN_TRANSIT.count +
            dashboard.statusSections.SCHEDULED_FOR_DELIVERY.count +
            dashboard.statusSections.OUT_FOR_DELIVERY.count
          }
          variant="active"
          description="Picked up to last-mile"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h7l1-1zm0 0l4-4m0 0l3 3m-3-3v8"
              />
            </svg>
          }
        />
        <DashboardCard
          title="Delayed"
          count={dashboard.delayedPackages.count}
          variant="delayed"
          description="Needs investigation"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
        <DashboardCard
          title="Delivered"
          count={dashboard.deliveredPackages.count}
          variant="delivered"
          description="Successfully completed"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">
            Complete Package Status Graph
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Full status breakdown across the collection hub
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PACKAGE_STATUS_FLOW.map((status) => {
              const section = dashboard.statusSections[status];

              return (
                <div
                  key={status}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <p className="text-xs text-slate-500 font-medium">
                    {PACKAGE_STATUS_LABELS[status]}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">
                    {section.count}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {dashboard.statusGraph.statuses.map((node) => (
              <div key={node.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {node.label}
                  </span>
                  <span className="text-slate-500">
                    {node.count} package{node.count !== 1 ? "s" : ""} (
                    {node.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${STATUS_GRAPH_COLORS[node.status]}`}
                    style={{
                      width: `${Math.max(node.percentage, node.count > 0 ? 2 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {PACKAGE_STATUS_FLOW.map((status) => {
        const meta = STATUS_SECTION_META[status];
        const section = dashboard.statusSections[status];

        return (
          <PackageSection
            key={status}
            title={meta.title}
            packages={section.packages}
            showDelayReason={meta.showDelayReason}
            onStartDelivery={
              status === "SCHEDULED_FOR_DELIVERY"
                ? handleStartDelivery
                : undefined
            }
            onMarkDelivered={
              meta.allowMarkDelivered ? handleMarkDelivered : undefined
            }
          />
        );
      })}
    </div>
  );
}
