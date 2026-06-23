import { getPackages } from "./package.service";

export const getDashboardData = async () => {
  const [
    toBePickedPackages,
    pickedUpPackages,
    inTransitPackages,
    delayedPackages,
    deliveredPackages,
    outForDeliveryPackages,
  ] = await Promise.all([
    getPackages(0),
    getPackages(1),
    getPackages(2),
    getPackages(3),
    getPackages(4),
    getPackages(5),
  ]);

  const pendingPackages = [...toBePickedPackages];
  const activePackages = [...pickedUpPackages, ...inTransitPackages];

  return {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    activePackages: { count: activePackages.length, packages: activePackages },
    delayedPackages: {
      count: delayedPackages.length,
      packages: delayedPackages,
    },
    deliveredPackages: {
      count: deliveredPackages.length,
      packages: deliveredPackages,
    },
    outForDeliveryPackages: {
      count: outForDeliveryPackages.length,
      packages: outForDeliveryPackages,
    },
  };
};
