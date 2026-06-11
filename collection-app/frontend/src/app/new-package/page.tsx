import NewPackageForm from "@/components/pages/package/NewPackageForm";

export default function NewPackagePage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Package Entry</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details to create a new package and generate a tracking
          ID.
        </p>
      </div>
      <NewPackageForm />
    </div>
  );
}
