"use client";

import { useEffect, useState, useCallback } from "react";
import { createTruck, getTrucks } from "@/services/truck";
import { TruckResponse } from "@shared/types/truck";
import TrucksTable from "@/components/pages/dashboard/TruckTable";

export default function TrucksPageContent() {
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrucks();
      setTrucks(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleCreateTruck = async () => {
    await createTruck();
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trucks</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage and track all trucks in the system
        </p>
      </div>

      {/* Package list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">All trucks</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {trucks.length} {trucks.length === 1 ? "truck" : "trucks"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={handleCreateTruck}
              className="rounded-md bg-black text-white px-3 py-1 text-xs"
            >
              Create A New Truck
            </button>
          </div>
        </div>
        <TrucksTable trucks={trucks} noActions />
      </div>
    </div>
  );
}
