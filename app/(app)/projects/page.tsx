import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "va";

  type ProjectRow = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };

  let rows: ProjectRow[] = [];

  if (role === "client") {
    const { data } = await supabase
      .from("project_members")
      .select("projects(id, name, description, created_at)")
      .eq("user_id", user.id);
    rows = (data ?? [])
      .map((m) => (Array.isArray(m.projects) ? m.projects[0] : m.projects))
      .filter(Boolean) as ProjectRow[];
  } else {
    const { data } = await supabase
      .from("projects")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as ProjectRow[];
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        {role !== "client" && (
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <h2 className="font-medium text-gray-900">{p.name}</h2>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {p.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-700">No projects yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            {role === "client"
              ? "Your VA will invite you to a project once one is created."
              : "Create a project to invite your first client."}
          </p>
          {role !== "client" && (
            <Link href="/projects/new">
              <Button variant="secondary" size="sm" className="mt-4">
                New project
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
