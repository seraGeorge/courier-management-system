import DashboardPageContent from "@/components/pages/dashboard/DashboardPageContent";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Courier Dashboard</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardPageContent />
      </Suspense>
    </div>
  );
}
