import { Suspense } from "react";
import DashboardPageContent from "@/components/pages/dashboard/DashboardPageContent";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading dashboard…
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
