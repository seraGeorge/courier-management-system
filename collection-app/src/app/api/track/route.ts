import { prisma } from "@/lib/prisma";
import { TrackPackageSchema } from "@/lib/validations/track";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = TrackPackageSchema.safeParse(body);

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

  const { trackingId, captchaVerified } = result.data;
  const pkg = await prisma.package.findUnique({
    where: {
      trackingId,
    },
  });

  if (!captchaVerified) {
    return NextResponse.json(
      {
        message: "Captcha verification failed",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  if (!pkg) {
    return NextResponse.json(
      {
        message: "Tracking ID not found",
        status: 404,
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    trackingId: pkg.trackingId,
    status: pkg.status,
    region: pkg.region,
    delayReason: pkg.delayReason,
  });
}
