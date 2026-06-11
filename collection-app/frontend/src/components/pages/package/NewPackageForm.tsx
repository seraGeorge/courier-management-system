"use client";

import { useEffect, useState } from "react";
import { createPackage } from "@/services/package";
import type { Package } from "@/types/package";
import { getRegions } from "@/services/region";
import { Region } from "@/types/region";

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
    } catch (err: any) {
      if (err?.fieldErrors) {
        setErrors(err.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-green-800">
          Package Created Successfully
        </h2>
        <p className="text-sm text-gray-600">
          Share this tracking ID with the customer:
        </p>
        <p className="text-2xl font-mono font-bold text-green-700">
          {result.trackingId}
        </p>
        <div className="text-sm text-gray-700 space-y-1 pt-2">
          <p>
            <span className="font-medium">From:</span> {result.fromAddress}
          </p>
          <p>
            <span className="font-medium">To:</span> {result.toAddress}
          </p>
          <p>
            <span className="font-medium">Weight:</span> {result.weight} kg
          </p>
          <p>
            <span className="font-medium">Status:</span> {result.status}
          </p>
        </div>
        <button
          onClick={() => setResult(null)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Add another package
        </button>
      </div>
    );
  }

  return (
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
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
}
