"use client";

import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { trackPackage } from "@/services/track";
import type { TrackResult } from "@/types/track";
import { ApiError, ApiResponse, ErrorCode } from "@/services/fetch";
import AppEnv from "@/config/env";

const STATUS_LABELS: Record<string, string> = {
  TO_BE_PICKED_UP: "Awaiting Pickup",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELAYED: "Delayed",
  DELIVERED: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  TO_BE_PICKED_UP: "bg-gray-100 text-gray-700 border-gray-200",
  PICKED_UP: "bg-blue-50 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  DELAYED: "bg-red-50 text-red-700 border-red-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_STEPS = [
  "TO_BE_PICKED_UP",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
];

export default function TrackPackageForm() {
  const [trackingId, setTrackingId] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Please complete the captcha.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await trackPackage({
        trackingId,
        captchaVerified: captchaToken ? 1 : 0,
      });
      setResult(response.data);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (err: unknown) {
      const apiError = err as ApiResponse<null>;

      if (apiError.error?.code === ErrorCode.VALIDATION_ERROR) {
        setErrors(apiError.error.fieldErrors ?? {});
      } else if ((err as ApiError)?.code === ErrorCode.PACKAGE_NOT_FOUND) {
        setError("No package found with this tracking ID.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result
    ? result.status === "DELAYED"
      ? STATUS_STEPS.indexOf("IN_TRANSIT")
      : STATUS_STEPS.indexOf(result.status)
    : -1;

  return (
    <div className="space-y-6">
      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tracking ID
          </label>
          <input
            value={trackingId}
            onChange={(e) => {
              setTrackingId(e.target.value);
              setError(null);
              setErrors({});
              setResult(null);
            }}
            placeholder="e.g. 9fb1f171-2d59-40ee-b631-1d9ecc8d0a41"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-black"
          />
          {errors.trackingId?.map((e) => (
            <p key={e} className="text-red-500 text-xs mt-1">
              {e}
            </p>
          ))}
          {errors.captchaVerified?.map((e) => (
            <p key={e} className="text-red-500 text-xs mt-1">
              {e}
            </p>
          ))}
        </div>

        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={AppEnv.RECAPTCHA_SITE_KEY}
            onChange={(token) => {
              setCaptchaToken(token);
              setError(null);
            }}
            onExpired={() => setCaptchaToken(null)}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !trackingId.trim()}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Tracking..." : "Track Package"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">
                {result.trackingId}
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Package Status
              </h2>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_COLORS[result.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {STATUS_LABELS[result.status] ?? result.status}
            </span>
          </div>

          {/* Progress timeline */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute left-0 top-3 h-0.5 bg-blue-500 z-0 transition-all"
                style={{
                  width:
                    currentStep === 0
                      ? "0%"
                      : currentStep === 1
                        ? "33%"
                        : currentStep === 2
                          ? "66%"
                          : currentStep === 3
                            ? "100%"
                            : "0%",
                }}
              />
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step}
                  className="flex flex-col items-center gap-2 z-10"
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                      i < currentStep
                        ? "bg-blue-500 border-blue-500 text-white"
                        : i === currentStep
                          ? result.status === "DELAYED"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs text-center max-w-16 leading-tight ${i <= currentStep ? "text-gray-700 font-medium" : "text-gray-400"}`}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Current Region</p>
                <p className="text-sm font-medium text-gray-800">
                  {result.region.name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Current Status</p>
                <p className="text-sm font-medium text-gray-800">
                  {STATUS_LABELS[result.status] ?? result.status}
                </p>
              </div>
            </div>

            {/* Delay banner */}
            {result.status === "DELAYED" && result.delayReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-3">
                <span className="text-red-500 mt-0.5">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">
                    Package Delayed
                  </p>
                  <p className="text-sm text-red-600">{result.delayReason}</p>
                </div>
              </div>
            )}

            {/* Bill of sale */}
            {result.sale && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Bill of Sale
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Shipping Amount</span>
                  <span className="font-semibold text-gray-900 text-base">
                    ₹{result.sale.amount}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Issued on{" "}
                  {new Date(result.sale.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
