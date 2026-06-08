import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const pendingPackages = await prisma.package.findMany({
    where: {
      status: "TO_BE_PICKED_UP",
    },
  });

  const transitedPackages = await prisma.package.findMany({
    where: {
      status: "IN_TRANSIT",
    },
  });

  const delayedPackages = await prisma.package.findMany({
    where: {
      status: "DELAYED",
    },
  });

  const data = {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    transitedPackages: {
      count: transitedPackages.length,
      packages: transitedPackages,
    },
    delayedPackages: {
      count: delayedPackages.length,
      packages: delayedPackages,
    },
  };

  return NextResponse.json(
    {
      message: "Dashboard data fetched successfully",
      data,
    },
    {
      status: 200,
    },
  );
}
