import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar, MobileTopBar } from "@/components/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role: string = profile?.role ?? "va";
  const displayName: string = profile?.full_name ?? user.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <AppSidebar role={role} displayName={displayName} />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <MobileTopBar role={role} displayName={displayName} />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
