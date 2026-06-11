import { getDashboard } from "@/services/dashboard";
import DashboardCard from "./DashboardCard";
import PackageSection from "./PackageSection";

export default async function DashboardPageContent() {
  const response = await getDashboard();
  const dashboard = response.data;

  if (!dashboard) {
    return <div>Failed to load dashboard</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Pending Packages"
          count={dashboard.pendingPackages.count}
        />
        <DashboardCard
          title="In Transit"
          count={dashboard.activePackages.count}
        />
        <DashboardCard
          title="Delayed Packages"
          count={dashboard.delayedPackages.count}
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
    </>
  );
}
