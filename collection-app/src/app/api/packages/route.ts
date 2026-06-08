import { prisma } from "@/lib/prisma";
import { CreatePackageSchema } from "@/lib/validations/package";
import { NextResponse } from "next/server";

export function GET() {}

export async function POST(req: Request) {
  const body = await req.json();

  const result = CreatePackageSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({
      message: "Invalid request data",
      errors: result.error?.flatten(),
      status: 400,
    });
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
    },
  });

  return NextResponse.json(newPackage, {
    status: 201,
  });
}
