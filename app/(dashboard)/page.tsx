import { unstable_cache } from "next/cache";
import { getDashboardStats } from "@/lib/api/dashboard";
import DashboardClient from "@/components/DashboardClient";
import { cookies } from "next/headers";

// Cache the dashboard stats at the server level for 5 minutes.
// This is only used for Admins (global stats).
const getCachedDashboardStats = unstable_cache(
  async () => getDashboardStats(),
  ["dashboard-stats"],
  { revalidate: 300 } // 5 minutes
);

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("auth_role")?.value || "admin";
  const supervisorId = cookieStore.get("supervisor_id")?.value;

  // If it's a supervisor, we fetch fresh stats for their specific view.
  // For admins, we use the cached global stats.
  const initialStats = (role === "supervisor" && supervisorId)
    ? await getDashboardStats(supervisorId)
    : await getCachedDashboardStats();

  return (
    <DashboardClient 
      initialStats={initialStats} 
      role={role} 
      supervisorId={supervisorId} 
    />
  );
}
