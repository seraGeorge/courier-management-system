"use client";

import { useEffect, useState } from "react";
import { createPackage } from "@/services/package";
import type { Package } from "@/types/package";
import { getRegions } from "@/services/region";
import { Region } from "@/types/region";
import { ApiResponse, ErrorCode } from "@/services/fetch";

export default function NewPackageForm() {
  const [regions, setRegions] = useState<Region[]>([]);

  // Fetch regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await getRegions();
        setRegions(response.data ?? []);
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };
    fetchRegions();
  }, []);

  const [form, setForm] = useState({
    senderName: "",
    receiverName: "",
    fromAddress: "",
    toAddress: "",
    weight: "",
    regionCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setResult(null);

    try {
      const response = await createPackage({
        ...form,
        weight: parseFloat(form.weight),
      });
      setResult(response.data);
      // reset form after success
      setForm({
        senderName: "",
        receiverName: "",
        fromAddress: "",
        toAddress: "",
        weight: "",
        regionCode: "",
      });
    } catch (err) {
      const error = err as ApiResponse<null>;
      if (error.error?.code === ErrorCode.VALIDATION_ERROR) {
        setErrors(error.error.fieldErrors ?? {});
      }
    } finally {
      setLoading(false);
    }
  };
  if (result) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs">
              ✓
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Package Created
            </h2>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">
              Tracking ID — share with customer
            </p>
            <p className="text-lg font-mono font-bold text-gray-900 break-all">
              {result.trackingId}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">From</p>
              <p className="font-medium text-gray-800">{result.fromAddress}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">To</p>
              <p className="font-medium text-gray-800">{result.toAddress}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Weight</p>
              <p className="font-medium text-gray-800">{result.weight} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <p className="font-medium text-gray-800">Awaiting Pickup</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setResult(null)}
            className="text-sm text-blue-600 hover:underline"
          >
            Add another package →
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: "Sender Name", name: "senderName" },
        { label: "Receiver Name", name: "receiverName" },
        { label: "From Address", name: "fromAddress" },
        { label: "To Address", name: "toAddress" },
      ].map(({ label, name }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            name={name}
            value={form[name as keyof typeof form]}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors[name]?.map((e) => (
            <p key={e} className="text-red-500 text-xs mt-1">
              {e}
            </p>
          ))}
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Weight (kg)
        </label>
        <input
          name="weight"
          type="number"
          step="0.1"
          value={form.weight}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.weight?.map((e) => (
          <p key={e} className="text-red-500 text-xs mt-1">
            {e}
          </p>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Region
        </label>
        <select
          name="regionCode"
          value={form.regionCode}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a region</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        {errors.region?.map((e) => (
          <p key={e} className="text-red-500 text-xs mt-1">
            {e}
          </p>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Package"}
      </button>
    </form>
  </div>
);
}
