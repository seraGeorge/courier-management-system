import TrackPackageForm from "@/components/pages/package/TrackPackageForm";

export default function TrackPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-7 py-6 shadow-lg">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
          Shipment Tracking
        </p>
        <h1 className="text-2xl font-bold text-white">Track Your Package</h1>
        <p className="text-blue-200 text-sm mt-1">
          Enter your tracking ID to see the latest delivery movement.
        </p>
      </div>
      <div className="w-full">
        <TrackPackageForm />
      </div>
    </div>
  );
}
