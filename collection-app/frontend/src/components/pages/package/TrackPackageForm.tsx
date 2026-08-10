"use client";

import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { trackPackage } from "@/services/track";
import type { TrackResult } from "@/types/track";
import {
  PACKAGE_STATUS_DESCRIPTIONS,
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_SUBSTEPS,
  PACKAGE_TRACK_STEPS,
  type PackageStatus,
} from "@/types/package-status";
import { ApiResponse, ErrorCode } from "@/services/fetch";
import AppEnv from "@/config/env";

const STATUS_COLORS: Record<PackageStatus, string> = {
  TO_BE_PICKED_UP: "bg-slate-100 text-slate-700 border-slate-200",
  PICKED_UP: "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  IN_TRANSIT: "bg-amber-100 text-amber-700 border-amber-200",
  SCHEDULED_FOR_DELIVERY: "bg-violet-100 text-violet-700 border-violet-200",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 border-orange-200",
  DELAYED: "bg-red-100 text-red-700 border-red-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type TrackStep = (typeof PACKAGE_TRACK_STEPS)[number];

type DelayPeriod = {
  startedAt: string;
  endedAt: string | null;
  reason: string | null;
  duringStep: TrackStep;
};

function formatTrackDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDelayDuration(start: string, end: string | null) {
  const diffMs = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  if (diffMs <= 0) return "Less than a minute";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const parts = [`${days}d`];
    if (hours > 0) parts.push(`${hours}h`);
    return parts.join(" ");
  }
  if (hours > 0) {
    const parts = [`${hours}h`];
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  }
  if (minutes > 0) return `${minutes}m`;
  return "Less than a minute";
}

function statusBeforeDelay(
  history: TrackResult["history"],
  delayIndex: number,
): TrackStep {
  for (let i = delayIndex - 1; i >= 0; i--) {
    if (history[i].status !== "DELAYED") {
      return history[i].status as TrackStep;
    }
  }
  return "TO_BE_PICKED_UP";
}

function extractDelayPeriods(result: TrackResult): DelayPeriod[] {
  return result.history.flatMap((event, index) => {
    if (event.status !== "DELAYED") return [];

    const nextNonDelay = result.history
      .slice(index + 1)
      .find((entry) => entry.status !== "DELAYED");

    return [
      {
        startedAt: event.at,
        endedAt: nextNonDelay?.at ?? null,
        reason: event.delayReason,
        duringStep: statusBeforeDelay(result.history, index),
      },
    ];
  });
}

function groupDelaysByStep(
  delays: DelayPeriod[],
): Partial<Record<TrackStep, DelayPeriod[]>> {
  return delays.reduce<Partial<Record<TrackStep, DelayPeriod[]>>>((grouped, delay) => {
    const existing = grouped[delay.duringStep] ?? [];
    grouped[delay.duringStep] = [...existing, delay];
    return grouped;
  }, {});
}

function formatDelayTiming(delay: DelayPeriod) {
  const duration = formatDelayDuration(delay.startedAt, delay.endedAt);

  if (delay.endedAt) {
    return `Delayed from ${formatTrackDate(delay.startedAt)} to ${formatTrackDate(delay.endedAt)} (${duration})`;
  }

  return `Delayed since ${formatTrackDate(delay.startedAt)} — still ongoing (${duration} so far)`;
}

function resolveProgressStatus(result: TrackResult): PackageStatus {
  if (result.status !== "DELAYED") return result.status;

  for (let i = result.history.length - 1; i >= 0; i--) {
    if (result.history[i].status !== "DELAYED") {
      return result.history[i].status;
    }
  }

  return "IN_TRANSIT";
}

function timestampForStep(
  step: PackageStatus,
  result: TrackResult,
): string | null {
  if (step === "TO_BE_PICKED_UP") return result.createdAt;

  const match = [...result.history]
    .reverse()
    .find((event) => event.status === step);

  return match?.at ?? null;
}

export default function TrackPackageForm() {
  const [trackingId, setTrackingId] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

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
      resetCaptcha();
    } catch (err: unknown) {
      const apiError = err as ApiResponse<null>;
      const code = apiError.error?.code;
      const serverMessage = apiError.message?.trim();

      if (code === ErrorCode.VALIDATION_ERROR) {
        const fieldErrors = apiError.error?.fieldErrors ?? {};
        const firstFieldError = Object.values(fieldErrors).flat()[0];
        setError(
          serverMessage ||
            firstFieldError ||
            "Please fix the highlighted fields and try again.",
        );
      } else if (code === ErrorCode.CAPTCHA_FAILED) {
        setError(
          serverMessage ||
            "Captcha verification failed. Please complete the captcha and try again.",
        );
        resetCaptcha();
      } else if (code === ErrorCode.PACKAGE_NOT_FOUND) {
        setError(
          serverMessage ||
            `Invalid tracking ID "${trackingId.trim()}". No package was found with this ID.`,
        );
      } else if (code === ErrorCode.INTERNAL_SERVER_ERROR) {
        setError(
          serverMessage ||
            "We couldn't load the package timeline right now. Please try again in a moment.",
        );
      } else {
        setError(
          "Unable to track this package right now. Check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const progressStatus = result ? resolveProgressStatus(result) : null;
  const currentStep = progressStatus
    ? PACKAGE_TRACK_STEPS.indexOf(
        progressStatus as (typeof PACKAGE_TRACK_STEPS)[number],
      )
    : -1;
  const isDelayed = result?.status === "DELAYED";
  const isDelivered = result?.status === "DELIVERED";
  const delaysByStep = result
    ? groupDelaysByStep(extractDelayPeriods(result))
    : {};

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tracking ID
          </label>
          <input
            value={trackingId}
            onChange={(e) => {
              setTrackingId(e.target.value);
              setError(null);
              setResult(null);
              resetCaptcha();
            }}
            placeholder="e.g. 9fb1f171-2d59-40ee-b631-1d9ecc8d0a41"
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 font-mono text-slate-900 ${
              error
                ? "border-red-400 focus:ring-red-400"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
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
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Tracking..." : "Track Package"}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-mono mb-1 truncate">
                {result.trackingId}
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Package Status
              </h2>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_COLORS[result.status]}`}
            >
              {PACKAGE_STATUS_LABELS[result.status]}
            </span>
          </div>

          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
              Delivery Progress
            </p>
            <ol className="relative space-y-0">
              {PACKAGE_TRACK_STEPS.map((step, i) => {
                const completed = i < currentStep || isDelivered;
                const current = i === currentStep && !isDelivered;
                const upcoming = i > currentStep && !isDelivered;
                const timestamp = timestampForStep(step, result);
                const substeps = PACKAGE_STATUS_SUBSTEPS[step] ?? [];
                const stepDelays = delaysByStep[step] ?? [];
                const showDetails = completed || current;

                return (
                  <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < PACKAGE_TRACK_STEPS.length - 1 && (
                      <span
                        className={`absolute left-2.5 top-6 bottom-0 w-0.5 ${
                          i < currentStep || isDelivered
                            ? "bg-blue-500"
                            : "bg-slate-200"
                        }`}
                        aria-hidden
                      />
                    )}

                    <div
                      className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                        completed
                          ? "bg-blue-500 border-blue-500 text-white"
                          : current && isDelayed
                            ? "bg-red-500 border-red-500 text-white"
                            : current
                              ? "bg-blue-500 border-blue-500 text-white ring-4 ring-blue-100"
                              : "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {completed ? "✓" : i + 1}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p
                          className={`text-sm font-semibold ${
                            upcoming ? "text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {PACKAGE_STATUS_LABELS[step]}
                          {current && (
                            <span
                              className={`ml-2 text-[10px] font-bold uppercase tracking-wide ${
                                isDelayed ? "text-red-600" : "text-blue-600"
                              }`}
                            >
                              {isDelayed ? "Delayed here" : "Current"}
                            </span>
                          )}
                        </p>
                        {timestamp && showDetails && (
                          <time className="text-xs text-slate-400">
                            {formatTrackDate(timestamp)}
                          </time>
                        )}
                      </div>

                      {showDetails && (
                        <>
                          <p
                            className={`mt-1 text-sm leading-relaxed ${
                              upcoming ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {current && isDelayed
                              ? PACKAGE_STATUS_DESCRIPTIONS.DELAYED
                              : PACKAGE_STATUS_DESCRIPTIONS[step]}
                          </p>

                          {substeps.length > 0 && (
                            <ul className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-3">
                              {substeps.map((detail) => (
                                <li
                                  key={detail}
                                  className={`text-xs leading-snug ${
                                    completed
                                      ? "text-slate-500"
                                      : current
                                        ? "text-slate-600"
                                        : "text-slate-400"
                                  }`}
                                >
                                  <span
                                    className={
                                      completed
                                        ? "text-blue-500 mr-1.5"
                                        : current
                                          ? "text-amber-500 mr-1.5"
                                          : "text-slate-300 mr-1.5"
                                    }
                                  >
                                    {completed ? "✓" : "•"}
                                  </span>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}

                          {stepDelays.length > 0 && (
                            <ul className="mt-2 space-y-2">
                              {stepDelays.map((delay, delayIndex) => (
                                <li
                                  key={`${delay.startedAt}-${delayIndex}`}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2"
                                >
                                  <p className="text-xs font-semibold text-red-700">
                                    Delay recorded
                                  </p>
                                  <p className="mt-0.5 text-xs leading-relaxed text-red-600">
                                    {formatDelayTiming(delay)}
                                  </p>
                                  {delay.reason && (
                                    <p className="mt-1 text-xs leading-relaxed text-red-600">
                                      {delay.reason}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Current Region</p>
                <p className="text-sm font-medium text-slate-800">
                  {result.region.name}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Current Status</p>
                <p className="text-sm font-medium text-slate-800">
                  {PACKAGE_STATUS_LABELS[result.status]}
                </p>
              </div>
            </div>

            {isDelayed && result.delayReason && (
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

            {result.sale && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  Bill of Sale
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Shipping Amount</span>
                  <span className="font-semibold text-slate-900 text-base">
                    ₹{result.sale.amount}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
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
