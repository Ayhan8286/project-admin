import { unstable_cache } from "next/cache";
import { getDashboardStats } from "@/lib/api/dashboard";
import DashboardClient from "@/components/DashboardClient";

// Cache the dashboard stats at the server level for 5 minutes.
// This means only the FIRST visitor per 5 min window hits Supabase —
// all others get instant in-memory response.
const getCachedDashboardStats = unstable_cache(
  getDashboardStats,
  ["dashboard-stats"],
  { revalidate: 300 } // 5 minutes
);

export default async function DashboardPage() {
  const initialStats = await getCachedDashboardStats();

  return <DashboardClient initialStats={initialStats} />;
}
