import { getDashboardStats } from "@/lib/api/dashboard";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 60; // Cache dashboard stats for 60 seconds

export default async function DashboardPage() {
  const initialStats = await getDashboardStats();

  return <DashboardClient initialStats={initialStats} />;
}
