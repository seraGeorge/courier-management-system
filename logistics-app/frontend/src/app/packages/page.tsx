import PackagesPageContent from "@/components/pages/packages/PackagesPageContent";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="text-sm text-gray-400">Loading...</div>}
      >
        <PackagesPageContent />
      </Suspense>
    </div>
  );
}
