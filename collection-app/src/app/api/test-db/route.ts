import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  const count = await prisma.package.count();

  return NextResponse.json({
    packages: count,
  });
}
