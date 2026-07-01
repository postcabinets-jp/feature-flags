import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FlagDetailClient from "@/components/flags/FlagDetailClient";

interface PageProps {
  params: Promise<{ org: string; project: string; flagKey: string }>;
}

export default async function FlagDetailPage({ params }: PageProps) {
  const { org: orgSlug, project: projectSlug, flagKey } = await params;

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

  const { data: flag } = await supabase
    .from("feature_flags")
    .select("*")
    .eq("project_id", project.id)
    .eq("key", flagKey)
    .single();
  if (!flag) notFound();

  const { data: environments } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at");

  const { data: configs } = await supabase
    .from("flag_configurations")
    .select("*")
    .eq("flag_id", flag.id);

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  const canEdit = ["owner", "admin", "editor"].includes(membership?.role ?? "");

  // Recent audit logs for this flag
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("flag_id", flag.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <Link href={`/${orgSlug}/${projectSlug}`} className="hover:text-gray-900">{project.name}</Link>
        <span>/</span>
        <span className="font-mono text-gray-900">{flag.key}</span>
      </nav>

      <FlagDetailClient
        flag={flag}
        environments={environments ?? []}
        configs={configs ?? []}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        canEdit={canEdit}
        auditLogs={auditLogs ?? []}
      />
    </div>
  );
}
