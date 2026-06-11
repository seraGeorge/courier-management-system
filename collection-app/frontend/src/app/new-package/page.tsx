import NewPackageForm from "@/components/pages/package/NewPackageForm";

export default function NewPackagePage() {
  return (
    <div className="p-8 max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Package Entry</h1>
      <p className="text-gray-500 text-sm">
        Fill in the details below to create a new package and generate a
        tracking ID.
      </p>
      <NewPackageForm />
    </div>
  );
}
