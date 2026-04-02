import { Sidebar } from "@/components/Sidebar";
import { Prefetcher } from "@/components/Prefetcher";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("auth_role")?.value || "admin";
  let userName = role === "admin" ? "Admin" : "Supervisor";
  let supervisorId: string | undefined = undefined;

  if (role === "admin") {
    const token = cookieStore.get("supabase_access_token")?.value;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user && user.email) {
        userName = user.email.split('@')[0];
      }
    }
  } else if (role === "supervisor") {
    supervisorId = cookieStore.get("supervisor_id")?.value;
    if (supervisorId) {
      const { data } = await supabase
        .from('supervisors')
        .select('name')
        .eq('id', supervisorId)
        .single();
      if (data && data.name) {
        userName = data.name;
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f4] dark:bg-[#0c1a0d] text-foreground transition-colors duration-200 relative">
      {/* Vibrant Gradient mesh orbs for glassmorphism */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-green-500/30 dark:bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] -left-20 w-[500px] h-[500px] rounded-full bg-emerald-400/30 dark:bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-300/30 dark:bg-teal-400/10 blur-[100px]" />
      </div>
      <Prefetcher />
      <Sidebar role={role} userName={userName} supervisorId={supervisorId} />
      <main className="flex-1 overflow-y-auto relative z-10 bg-transparent flex flex-col custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
