import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EnvironmentsClient from "@/components/environments/EnvironmentsClient";

interface PageProps {
  params: Promise<{ org: string; project: string }>;
}

export default async function EnvironmentsPage({ params }: PageProps) {
  const { org: orgSlug, project: projectSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .single();
  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", org.id)
    .eq("slug", projectSlug)
    .single();
  if (!project) notFound();

  const { data: environments } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  const canAdmin = ["owner", "admin"].includes(membership?.role ?? "");

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <Link href={`/${orgSlug}/${projectSlug}`} className="hover:text-gray-900">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">環境</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 border-b border-gray-200 -mx-1">
          {[
            { label: "フラグ", href: `/${orgSlug}/${projectSlug}` },
            { label: "環境", href: `/${orgSlug}/${projectSlug}/environments` },
            { label: "監査ログ", href: `/${orgSlug}/${projectSlug}/audit` },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                item.href === `/${orgSlug}/${projectSlug}/environments`
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <EnvironmentsClient
        environments={environments ?? []}
        projectId={project.id}
        canAdmin={canAdmin}
      />
    </div>
  );
}
