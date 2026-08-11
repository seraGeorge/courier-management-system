import { trackPackage, verifyRecaptcha } from "@/services/track.service";
import { buildResponse } from "@/utils/response";
import { TrackPackageSchema } from "@/validations/track";
import { type Request, type Response } from "express";

export const track = async (req: Request, res: Response) => {
  const result = TrackPackageSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Please fix the highlighted fields and try again.", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  const { trackingId, captchaToken } = result.data;
  const captchaValid = await verifyRecaptcha(captchaToken.toString());

  if (!captchaValid) {
    return res.status(400).json(
      buildResponse(
        400,
        "Captcha verification failed. Please complete the captcha and try again.",
        null,
        {
          code: "CAPTCHA_FAILED",
        },
      ),
    );
  }

  try {
    const pkg = await trackPackage(trackingId);

    if (!pkg) {
      return res.status(404).json(
        buildResponse(
          404,
          `Invalid tracking ID "${trackingId}". No package was found with this ID.`,
          null,
          {
            code: "PACKAGE_NOT_FOUND",
          },
        ),
      );
    }

    return res.status(200).json(
      buildResponse(200, "Package retrieved successfully", {
        trackingId: pkg.trackingId,
        status: pkg.status,
        region: pkg.region,
        delayReason: pkg.delayReason,
        createdAt: pkg.createdAt,
        sale: pkg.sale
          ? { amount: pkg.sale.amount, createdAt: pkg.sale.createdAt }
          : null,
        history: pkg.history.map((event) => ({
          status: event.status,
          delayReason: event.delayReason,
          at: event.receivedAt,
        })),
      }),
    );
  } catch (err) {
    console.error("[Track] Failed to load package timeline", err);
    return res.status(500).json(
      buildResponse(
        500,
        "We couldn't load the package timeline right now. Please try again in a moment.",
        null,
        {
          code: "INTERNAL_SERVER_ERROR",
        },
      ),
    );
  }
};
