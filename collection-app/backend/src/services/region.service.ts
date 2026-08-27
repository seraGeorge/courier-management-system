import { prisma } from "@/lib/prisma";
import { cacheService } from "@/services/cache.service";

const REGIONS_CACHE_KEY = "regions:list";
const REGIONS_CACHE_TTL = 60 * 60; // 1 hour

type Regions = Awaited<ReturnType<typeof prisma.region.findMany>>;

export const getRegionsList = async () => {
  const cachedRegions = await cacheService.get<Regions>(REGIONS_CACHE_KEY);

  if (cachedRegions) {
    console.log("[Cache] Regions HIT");
    return cachedRegions;
  }

  console.log("[Cache] Regions MISS");

  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
  });

  await cacheService.set(REGIONS_CACHE_KEY, regions, REGIONS_CACHE_TTL);

  return regions;
};
