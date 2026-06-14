"use client";

import React, { useEffect, useState } from "react";
import PackageTable from "./PackageTable";
import BagTable from "./BagTable";
import { getPackages } from "@/services/package";
import { getBags } from "@/services/bag";
import { BagResponse, PackageResponse } from "@shared/types";
import { getShift } from "@/helpers/date";
import MetricCard from "@/components/MetricCard";
import Section from "@/components/Section";
type Shift = "all" | "morning" | "noon";

const DashboardPageContent = () => {
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [bags, setBags] = useState<BagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<Shift>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [pkgRes, bagRes] = await Promise.all([getPackages(), getBags()]);

        setPackages(pkgRes.data);
        setBags(bagRes.data);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  // ── Derived sections ────────────────────────────────────────────────────────

  // Section 1: New arrivals — yet to be bagged, bucketed by shift
  const pending = packages.filter((p) => p.status === "TO_BE_PICKED_UP");
  const pendingFiltered =
    shift === "all"
      ? pending
      : pending.filter((p) => getShift(p.createdAt.toString()) === shift);

  // Section 2: Packages that have been bagged
  const bagged = packages.filter((p) => p.status === "ADDED_TO_BAG");

  // Section 3: En route / actively moving
  const enRoute = packages.filter((p) =>
    ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_REGION"].includes(p.status),
  );

  // Section 4: Delayed
  const delayed = packages.filter((p) => p.status === "DELAYED");

  // Metrics
  const totalPending = pending.length;
  const totalMoving = enRoute.length;
  const totalDelayed = delayed.length;

  return (
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
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 bg-white"
          >
            <option value="all">All shifts</option>
            <option value="morning">Morning batch</option>
            <option value="noon">Noon batch</option>
          </select>
        }
      >
        <PackageTable packages={pendingFiltered} />
      </Section>

      {/* Section 2: Bagged packages */}
      <Section title="Packages Added to Bags" count={bagged.length}>
        <BagTable bags={bags} />
      </Section>

      {/* Section 3: Actively moving */}
      <Section title="Actively Moving" count={enRoute.length}>
        <PackageTable packages={enRoute} />
      </Section>

      {/* Section 4: Delayed */}
      <Section title="Delayed Packages" count={delayed.length}>
        <PackageTable packages={delayed} />
      </Section>
    </div>
  );
};

export default DashboardPageContent;
