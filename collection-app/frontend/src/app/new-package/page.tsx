import NewPackageForm from "@/components/pages/package/NewPackageForm";

export default function NewPackagePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-7 py-6 shadow-lg">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
          New Shipment
        </p>
        <h1 className="text-2xl font-bold text-white">Create Package Entry</h1>
        <p className="text-blue-200 text-sm mt-1">
          Fill in shipment details and generate a tracking ID instantly.
        </p>
      </div>
      <NewPackageForm />
    </div>
  );
}
