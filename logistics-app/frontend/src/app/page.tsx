import DashboardPageContent from "@/components/pages/dashboard/DashboardPageContent";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="text-sm text-gray-400">Loading...</div>}
      >
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
