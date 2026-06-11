import { getDashboard } from "@/services/dashboard";
import DashboardCard from "./DashboardCard";
import PackageSection from "./PackageSection";

export default async function DashboardPageContent() {
  const response = await getDashboard();
  const dashboard = response.data;

  if (!dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-sm text-red-600">
        Failed to load dashboard data.
      </div>
    );
  }

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
    </div>
  );
}
