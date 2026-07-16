import { getPackages } from "./package.service";
import { PackageStatus } from "@/generated/prisma/client";

type DashboardSection = {
  count: number;
  packages: Awaited<ReturnType<typeof getPackages>>;
};

const STATUS_GRAPH_FLOW: Array<{
  code: number;
  status: PackageStatus;
  label: string;
}> = [
  { code: 0, status: PackageStatus.TO_BE_PICKED_UP, label: "Awaiting Pickup" },
  { code: 1, status: PackageStatus.PICKED_UP, label: "Picked Up" },
  { code: 2, status: PackageStatus.PROCESSING, label: "Processing" },
  { code: 3, status: PackageStatus.IN_TRANSIT, label: "In Transit" },
  {
    code: 5,
    status: PackageStatus.SCHEDULED_FOR_DELIVERY,
    label: "Scheduled for Delivery",
  },
  {
    code: 6,
    status: PackageStatus.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
  },
  { code: 4, status: PackageStatus.DELAYED, label: "Delayed" },
  { code: 7, status: PackageStatus.DELIVERED, label: "Delivered" },
];

export const getDashboardData = async () => {
  const statusResults = await Promise.all(
    STATUS_GRAPH_FLOW.map(async ({ code, status, label }) => {
      const packages = await getPackages(code);

      return {
        status,
        label,
        count: packages.length,
        packages,
      };
    }),
  );

  const statusSections = statusResults.reduce(
    (acc, result) => {
      acc[result.status] = {
        count: result.count,
        packages: result.packages,
      };

      return acc;
    },
    {} as Record<PackageStatus, DashboardSection>,
  );

  const totalPackages = statusResults.reduce(
    (total, result) => total + result.count,
    0,
  );

  const pendingPackages = [
    ...statusSections[PackageStatus.TO_BE_PICKED_UP].packages,
    ...statusSections[PackageStatus.PICKED_UP].packages,
    ...statusSections[PackageStatus.PROCESSING].packages,
  ];
  const activePackages = [
    ...statusSections[PackageStatus.IN_TRANSIT].packages,
    ...statusSections[PackageStatus.SCHEDULED_FOR_DELIVERY].packages,
    ...statusSections[PackageStatus.OUT_FOR_DELIVERY].packages,
  ];

  return {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    activePackages: { count: activePackages.length, packages: activePackages },
    delayedPackages: {
      count: statusSections[PackageStatus.DELAYED].count,
      packages: statusSections[PackageStatus.DELAYED].packages,
    },
    deliveredPackages: {
      count: statusSections[PackageStatus.DELIVERED].count,
      packages: statusSections[PackageStatus.DELIVERED].packages,
    },
    outForDeliveryPackages: {
      count: statusSections[PackageStatus.OUT_FOR_DELIVERY].count,
      packages: statusSections[PackageStatus.OUT_FOR_DELIVERY].packages,
    },
    statusSections,
    statusGraph: {
      totalPackages,
      statuses: statusResults.map((result) => ({
        status: result.status,
        label: result.label,
        count: result.count,
        packages: result.packages,
        percentage:
          totalPackages === 0
            ? 0
            : Number(((result.count / totalPackages) * 100).toFixed(1)),
      })),
    },
  };
};
