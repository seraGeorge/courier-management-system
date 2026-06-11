import { Package } from "./package";

export interface DashboardSection {
  count: number;
  packages: Package[];
};

export interface DashboardData {
  pendingPackages: DashboardSection;
  activePackages: DashboardSection;
  delayedPackages: DashboardSection;
};
