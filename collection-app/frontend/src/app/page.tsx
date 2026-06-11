import { Suspense } from "react";
import DashboardPageContent from "@/components/pages/dashboard/DashboardPageContent";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of all packages in the system
        </p>
      </div>
      <Suspense
        fallback={<div className="text-sm text-gray-400">Loading...</div>}
      >
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
