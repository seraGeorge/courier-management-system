import TrackPackageForm from "@/components/pages/package/TrackPackageForm";

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Package
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your tracking ID to get the latest status of your shipment.
          </p>
        </div>
        <TrackPackageForm />
      </div>
    </div>
  );
}
