"use client";

import { useEffect, useMemo, useState } from "react";
import PackageTable from "./PackageTable";
import { assignPackageToBag, createPackage, getPackages, updatePackageStatus } from "@/services/package";
import { createBag, getBags, sealBag } from "@/services/bag";
import { getShift } from "@/helpers/date";
import MetricCard from "@/components/MetricCard";
import Section from "@/components/Section";
import BagDispatchTable from "../bag/BagDispatchTable";
import {
  getTrucks,
  loadBagToTruck,
  updateTruckStatus,
} from "@/services/truck";
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
        getTrucks(["LOADED", "SCHEDULED","DELAYED", "DEPARTED"]),
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

  // Section 1: New arrivals — yet to be bagged, bucketed by shift
  const pending = useMemo(
    () => packages.filter((p) => p.status === "TO_BE_PICKED_UP"),
    [packages],
  );
  const pendingFiltered =
    shift === "all"
      ? pending
      : pending.filter((p) => getShift(p.createdAt.toString()) === shift);

  // Section 3: En route / actively moving
  const enRoute = useMemo(
    () =>
      packages.filter((p) =>
        ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_REGION"].includes(p.status),
      ),
    [packages],
  );

  // Section 4: Delayed
  const delayed = useMemo(
    () => packages.filter((p) => p.status === "DELAYED"),
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

  // Metrics
  const totalPending = pending.length;
  const totalMoving = enRoute.length;
  const totalDelayed = delayed.length;

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
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of all packages in the system
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Pending Packages"
            value={totalPending}
            variant="default"
          />
          <MetricCard
            label="Actively Moving"
            value={totalMoving}
            variant="blue"
          />
          <MetricCard
            label="Delayed Packages"
            value={totalDelayed}
            variant="red"
          />
        </div>

        {/* Section 1: Yet to be picked up */}
        <Section
          title="Packages Yet To Be Picked Up"
          count={pendingFiltered.length}
          action={
            <div className="flex items-center gap-2">
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Shift)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 bg-white"
              >
                <option value="all">All shifts</option>
                <option value="morning">Morning batch</option>
                <option value="noon">Noon batch</option>
              </select>
              {/* <button
                onClick={handlePackageCreate}
                className="rounded-md bg-black text-white px-3 py-1 text-xs"
              >
                Create A New Package
              </button> */}
            </div>
          }
        >
          <PackageTable
            packages={pendingFiltered}
            onAssign={setSelectedPackage}
          />
        </Section>
        {/* Section 2: Open bags ready for dispatch */}
        <Section
          title="Open Bags Ready For Dispatch"
          count={openBags.length}
          action={
            <button
              onClick={handleCreateBag}
              className="rounded-md bg-black text-white px-3 py-1 text-xs"
            >
              Create A New Bag
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
        {/* Section 3: Active Trucks */}
        <Section title="Active Trucks" count={activeTrucks.length}>
          <TrucksTable
            trucks={activeTrucks}
            onUpdateTruckStatus={handleTruckStatus}
          />
        </Section>

        {/* Section 4: Bagged packages */}
        <Section
          title="Packages From Latest Truck Arrival"
          count={latestArrivalPackages.length}
        >
          <PackageTable
            packages={latestArrivalPackages}
            onAssign={setSelectedPackage}
            scheduleForDelivery={scheduleForDelivery}
          />
        </Section>

        {/* Section 4: Delayed */}
        <Section title="Delayed Packages" count={delayed.length}>
          <PackageTable packages={delayed} noActions />
        </Section>
      </div>
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 text-black">
            <h2 className="font-semibold mb-4 ">Assign Package To Bag</h2>

            <p className="text-sm mb-4">{selectedPackage.trackingId}</p>

            <select
              value={selectedBag}
              onChange={(e) => setSelectedBag(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="">Select a bag</option>

              {openBags.map((bag) => (
                <option key={bag.bagNumber} value={bag.bagNumber}>
                  {bag.bagNumber}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setSelectedPackage(null)}>Cancel</button>
              <button
                onClick={handleAssign}
                className="bg-black text-white px-3 py-2 rounded-md"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPageContent;
