import { PackageStatus } from "@/generated/prisma/enums";
import { StatusMap } from "@/lib/constants/package-status";
import { prisma } from "@/lib/prisma";
import { UpdatePackageStatusSchema } from "@/lib/validations/update-package-status";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
  });

  if (!pkg) {
    return NextResponse.json(
      { message: "Package not found", status: 404 },
      { status: 404 },
    );
  }

  const body = await req.json();
  const result = UpdatePackageStatusSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: result.error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

const packageStatus = StatusMap[result.data.status as keyof typeof StatusMap];
  const updatedPackage = await prisma.package.update({
    where: { id },
    data: {
      status: packageStatus,
      delayReason:
        packageStatus === PackageStatus.DELAYED ? result.data.delayReason : null,
    },
  });
  
  const data = {
    data: updatedPackage,
    status: 200,
  };

  return NextResponse.json(data, {
    status: 200,
  });
}
