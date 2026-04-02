"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function loginAction(prevState: any, formData: FormData) {
  // Clear any existing session before trying to log in
  await supabase.auth.signOut();

  const rawEmail = formData.get("email") as string;
  const email = rawEmail?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const roleType = formData.get("roleType") as "admin" | "supervisor";

  if (!email || !password || !roleType) {
    return { error: "Please provide all required fields." };
  }

  const cookieStore = await cookies();

  if (roleType === "admin") {
    // Admin login uses Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: error?.message || "Invalid credentials" };
    }

    // Check if this user is a supervisor (should not login as admin)
    const { data: supervisorMatch } = await supabaseAdmin
      .from("supervisors")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (supervisorMatch) {
      await supabase.auth.signOut();
      return { error: "Access Denied: You are registered as a Supervisor, not an Admin." };
    }

    // Set Admin cookies
    cookieStore.set("auth_role", "admin", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    if (data.session) {
      cookieStore.set("supabase_access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: data.session.expires_in,
        path: "/",
      });
    }

    revalidatePath("/", "layout");
    redirect("/");
  } else {
    // Supervisor login uses Database Table lookup (Bypasses RLS)
    const { data: supervisor, error } = await supabaseAdmin
      .from("supervisors")
      .select("id, email, password")
      .ilike("email", email)
      .maybeSingle();

    if (error || !supervisor || supervisor.password !== password) {
      return { error: "Invalid login credentials." };
    }

    // Set Supervisor cookies
    cookieStore.set("auth_role", "supervisor", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.set("supervisor_id", supervisor.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    revalidatePath("/", "layout");
    redirect(`/supervisors/${supervisor.id}`);
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_role");
  cookieStore.delete("supabase_access_token");
  cookieStore.delete("supervisor_id");
  await supabase.auth.signOut();
  redirect("/login");
}
