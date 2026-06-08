import { prisma } from "@/lib/prisma";
import { CreatePackageSchema } from "@/lib/validations/package";
import { NextRequest, NextResponse } from "next/server";
import { PackageStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const region = searchParams.get("region");

  const whereClause: {
    status?: PackageStatus;
    currentRegion?: string;
  } = {};

  if (status) {
    if (Object.values(PackageStatus).includes(status as PackageStatus)) {
      whereClause.status = status as PackageStatus;
    } else {
      return NextResponse.json(
        { message: "Invalid status value", status: 400 },
        {
          status: 400,
        },
      );
    }
  }

  if (region) {
    whereClause.currentRegion = region;
  }

  const packages = await prisma.package.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(packages, {
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = CreatePackageSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: result.error.flatten(),
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  const trackingId = crypto.randomUUID();
  const newPackage = await prisma.package.create({
    data: {
      trackingId,
      senderName: result.data.senderName,
      receiverName: result.data.receiverName,
      fromAddress: result.data.fromAddress,
      toAddress: result.data.toAddress,
      weight: result.data.weight,
      region: result.data.region,
      status: result.data.status || PackageStatus.TO_BE_PICKED_UP,
    },
  });

  return NextResponse.json(newPackage, {
    status: 201,
  });
}
