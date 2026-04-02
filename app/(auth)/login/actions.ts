"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function loginAction(prevState: any, formData: FormData) {
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
    const { data: supervisorMatch } = await supabase
      .from("supervisors")
      .select("id")
      .eq("email", email)
      .single();

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

    redirect("/");
  } else {
    // Supervisor login uses Database Table
    const { data: supervisor, error } = await supabase
      .from("supervisors")
      .select("id, email, password")
      .ilike("email", email)
      .maybeSingle();

    if (error || !supervisor) {
      console.error("Supervisor Login Error:", error, "Supervisor Data:", supervisor, "Email tried:", email);
      return { error: `Debug: Not found in DB. Email tried: "${email}". Ensure email is exactly correct.` };
    }

    // Direct password check (User requested database-based auth)
    if (supervisor.password !== password) {
      return { error: "Invalid credentials." };
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
