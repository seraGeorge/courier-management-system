"use client";

import { useEffect, useMemo, useState } from "react";
import PackageTable from "./PackageTable";
import {
  assignPackageToBag,
  getPackages,
  updatePackageStatus,
} from "@/services/package";
import { createBag, getBags, sealBag } from "@/services/bag";
import { getShift } from "@/helpers/date";
import MetricCard from "@/components/MetricCard";
import Section from "@/components/Section";
import BagDispatchTable from "../bag/BagDispatchTable";
import { getTrucks, loadBagToTruck, updateTruckStatus } from "@/services/truck";
import { PackageResponse } from "@shared/types/package";
import { BagResponse } from "@shared/types/bag";
import TrucksTable from "@/components/pages/dashboard/TruckTable";
import { TruckResponse } from "@shared/types/truck";

type Shift = "all" | "morning" | "noon";

const DashboardPageContent = () => {
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [bags, setBags] = useState<BagResponse[]>([]);
  const [activeTrucks, setActiveTrucks] = useState<TruckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<Shift>("all");

  const [selectedPackage, setSelectedPackage] =
    useState<PackageResponse | null>(null);
  const [selectedBag, setSelectedBag] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, bagRes, activeTruckRes] = await Promise.all([
        getPackages(),
        getBags(),
        getTrucks(["LOADED", "SCHEDULED", "DELAYED", "DEPARTED"]),
      ]);
      setPackages(pkgRes.data);
      setBags(bagRes.data);
      setActiveTrucks(activeTruckRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, []);

  // ── Derived sections ────────────────────────────────────────────────────────

  const pending = useMemo(
    () => packages.filter((p) => p.status === "TO_BE_PICKED_UP"),
    [packages],
  );
  const pendingFiltered =
    shift === "all"
      ? pending
      : pending.filter((p) => getShift(p.createdAt.toString()) === shift);

  const enRoute = useMemo(
    () =>
      packages.filter((p) =>
        ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_REGION"].includes(p.status),
      ),
    [packages],
  );

  const delayed = useMemo(
    () => packages.filter((p) => p.status === "DELAYED"),
    [packages],
  );

  const delivered = useMemo(
    () => packages.filter((p) => p.status === "DELIVERED"),
    [packages],
  );

  const openBags = useMemo(
    () => bags.filter((bag) => bag.status === "OPEN"),
    [bags],
  );

  const latestArrivalPackages = useMemo(
    () => packages.filter((p) => p.status === "ARRIVED_AT_REGION"),
    [packages],
  );

  const totalPending = pending.length;
  const totalMoving = enRoute.length;
  const totalDelayed = delayed.length;
  const totalDelivered = delivered.length;

  const handleAssign = async () => {
    if (!selectedPackage || !selectedBag) return;
    await assignPackageToBag(selectedPackage.trackingId, selectedBag);
    setSelectedPackage(null);
    setSelectedBag("");
    await fetchData();
  };

  const scheduleForDelivery = async (pkg: PackageResponse) => {
    await updatePackageStatus(pkg.trackingId, "SCHEDULED_FOR_DELIVERY");
    await fetchData();
  };

  const handleSeal = async (bagNumber: string) => {
    await sealBag(bagNumber);
    await fetchData();
  };

  const handleTruckStatus = async (
    truckNumber: string,
    status: "DEPARTED" | "ARRIVED" | "DELAYED",
  ) => {
    await updateTruckStatus(truckNumber, status);
    await fetchData();
  };

  const handleCreateBag = async () => {
    await createBag();
    await fetchData();
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

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-8 py-7 shadow-lg">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-14 -left-8 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Operations Dashboard
              </p>
              <h1 className="text-2xl font-bold text-white">
                Courier Logistics Hub
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
                  System Live
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats inside hero */}
          <div className="relative mt-6 grid grid-cols-4 gap-3">
            {[
              { label: "Total Packages", value: packages.length },
              { label: "Open Bags", value: openBags.length },
              { label: "Active Trucks", value: activeTrucks.length },
              { label: "Delivered Today", value: totalDelivered },
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

        {/* ── Metric cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Awaiting Pickup"
            value={totalPending}
            variant="default"
            description="Not yet bagged"
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
          <MetricCard
            label="Actively Moving"
            value={totalMoving}
            variant="blue"
            description="In transit / picked up"
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
          <MetricCard
            label="Delayed"
            value={totalDelayed}
            variant="red"
            description="Require attention"
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
          <MetricCard
            label="Delivered"
            value={totalDelivered}
            variant="green"
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

        {/* ── Section 1: Yet to be picked up ───────────────────────────── */}
        <Section
          title="Packages Yet To Be Picked Up"
          count={pendingFiltered.length}
          itemLabel="package"
          action={
            <div className="flex items-center gap-2">
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Shift)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">All shifts</option>
                <option value="morning">Morning batch</option>
                <option value="noon">Noon batch</option>
              </select>
            </div>
          }
        >
          <PackageTable
            packages={pendingFiltered}
            onAssign={setSelectedPackage}
          />
        </Section>

        {/* ── Section 2: Open bags ─────────────────────────────────────── */}
        <Section
          title="Open Bags Ready For Dispatch"
          count={openBags.length}
          itemLabel="bag"
          action={
            <button
              onClick={handleCreateBag}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Bag
            </button>
          }
        >
          <BagDispatchTable
            bags={bags}
            onLoadToTruck={async (bagNumber, truckNumber) => {
              await loadBagToTruck(bagNumber, truckNumber);
              await fetchData();
            }}
            onSealBag={handleSeal}
          />
        </Section>

        {/* ── Section 3: Active Trucks ─────────────────────────────────── */}
        <Section
          title="Active Trucks"
          count={activeTrucks.length}
          itemLabel="truck"
        >
          <TrucksTable
            trucks={activeTrucks}
            onUpdateTruckStatus={handleTruckStatus}
          />
        </Section>

        {/* ── Section 4: Latest arrivals ───────────────────────────────── */}
        <Section
          title="Packages From Latest Truck Arrival"
          count={latestArrivalPackages.length}
          itemLabel="package"
        >
          <PackageTable
            packages={latestArrivalPackages}
            onAssign={setSelectedPackage}
            scheduleForDelivery={scheduleForDelivery}
          />
        </Section>

        {/* ── Section 5: Delivered packages ───────────────────────────── */}
        <Section
          title="Delivered Packages"
          count={totalDelivered}
          itemLabel="package"
        >
          <PackageTable packages={delivered} noActions showDeliveredInfo />
        </Section>

        {/* ── Section 6: Delayed packages ─────────────────────────────── */}
        <Section
          title="Delayed Packages"
          count={delayed.length}
          itemLabel="package"
        >
          <PackageTable packages={delayed} noActions />
        </Section>
      </div>

      {/* ── Assign-to-bag modal ──────────────────────────────────────────── */}
      {selectedPackage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPackage(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <h2 className="font-bold text-white text-lg">
                Assign Package to Bag
              </h2>
              <p className="text-blue-200 text-xs mt-1">
                Select an open bag for this package
              </p>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Package info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Package
                </p>
                <p className="font-mono text-sm font-bold text-slate-800">
                  {selectedPackage.trackingId}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-xs text-slate-400">From</p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedPackage.senderName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">To</p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedPackage.receiverName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Region</p>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedPackage.region.name}
                    </p>
                  </div>
                  {selectedPackage.weight && (
                    <div>
                      <p className="text-xs text-slate-400">Weight</p>
                      <p className="text-sm font-medium text-slate-700">
                        {selectedPackage.weight} kg
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bag selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Select Bag
                </label>
                <select
                  value={selectedBag}
                  onChange={(e) => setSelectedBag(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Choose an open bag…</option>
                  {openBags.map((bag) => (
                    <option key={bag.bagNumber} value={bag.bagNumber}>
                      {bag.bagNumber} — {bag.packages?.length ?? 0} package
                      {(bag.packages?.length ?? 0) !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                {openBags.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    No open bags available. Create a new bag first.
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                onClick={() => {
                  setSelectedPackage(null);
                  setSelectedBag("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedBag}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Assign Package
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPageContent;
