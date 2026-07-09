"use client";
import { getDashboard, updatePackageStatus } from "@/services/dashboard";
import DashboardCard from "./DashboardCard";
import PackageSection from "./PackageSection";
import { useEffect, useState } from "react";
import { DashboardData } from "@/types/dashboard";

export default function DashboardPageContent() {
  const [dashboard, setDashboard] = useState<DashboardData>();
  const fetchDashboard = async () => {
    const response = await getDashboard();
    setDashboard(response.data ?? undefined);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (!dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-sm text-red-600">
        Failed to load dashboard data.
      </div>
    );
  }

const handleMarkDelivered = async (trackingId: string) => {
  try {
    await updatePackageStatus(trackingId, 4);

    // Refresh the dashboard
    await fetchDashboard(); // or queryClient.invalidateQueries(...)
  } catch (error) {
    console.error(error);
  }
};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Pending Packages"
          count={dashboard.pendingPackages.count}
        />
        <DashboardCard
          title="Actively Moving"
          count={dashboard.activePackages.count}
          variant="active"
        />
        <DashboardCard
          title="Delayed Packages"
          count={dashboard.delayedPackages.count}
          variant="delayed"
        />
        <DashboardCard
          title="Delivered Packages"
          count={dashboard.deliveredPackages.count}
          variant="delivered"
        />
      </div>
      <PackageSection
        title="Packages Yet To Be Picked Up"
        packages={dashboard.pendingPackages.packages}
      />
      <PackageSection
        title="Actively Moving Deliveries"
        packages={dashboard.activePackages.packages}
      />
      <PackageSection
        title="Delayed Packages"
        packages={dashboard.delayedPackages.packages}
        showDelayReason
      />
      <PackageSection
        title="Out For Delivery Packages"
        packages={dashboard.outForDeliveryPackages.packages}
        onMarkDelivered={handleMarkDelivered}
      />
      <PackageSection
        title="Delivered Packages"
        packages={dashboard.deliveredPackages.packages}
      />
    </div>
  );
}
