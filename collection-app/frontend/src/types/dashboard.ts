import { Package } from "./package";
import { PackageStatus } from "./package-status";

export interface DashboardSection {
  count: number;
  packages: Package[];
};

export interface DashboardData {
  pendingPackages: DashboardSection;
  activePackages: DashboardSection;
  delayedPackages: DashboardSection;
  deliveredPackages: DashboardSection;
  outForDeliveryPackages: DashboardSection;
  statusSections: Record<PackageStatus, DashboardSection>;
  statusGraph: {
    totalPackages: number;
    statuses: Array<{
      status: PackageStatus;
      label: string;
      count: number;
      packages: Package[];
      percentage: number;
    }>;
  };
};
