import { trackPackage } from "@/services/track.service";
import { buildResponse } from "@/utils/response";
import { TrackPackageSchema } from "@/validations/track";
import { type Request, type Response } from "express";

export const track = async (req: Request, res: Response) => {
  const result = TrackPackageSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json(
        buildResponse(
          400,
          "Invalid request data",
          null,
          "VALIDATION_ERROR",
          result.error.flatten().fieldErrors,
        ),
      );
  }

  const { trackingId, captchaVerified } = result.data;

  if (!captchaVerified) {
    return res
      .status(400)
      .json(
        buildResponse(
          400,
          "Captcha verification failed",
          null,
          "CAPTCHA_FAILED",
          null,
        ),
      );
  }

  const pkg = await trackPackage(trackingId);

  if (!pkg) {
    return res
      .status(404)
      .json(
        buildResponse(
          404,
          "Package not found",
          null,
          "PACKAGE_NOT_FOUND",
          null,
        ),
      );
  }

  return res.status(200).json(
    buildResponse(200, "Package retrieved successfully", {
      trackingId: pkg.trackingId,
      status: pkg.status,
      region: pkg.region,
      delayReason: pkg.delayReason,
      sale: pkg.sale
        ? { amount: pkg.sale.amount, createdAt: pkg.sale.createdAt }
        : null,
    }),
  );
};
