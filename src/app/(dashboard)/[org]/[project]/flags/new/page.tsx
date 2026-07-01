import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewFlagForm from "@/components/flags/NewFlagForm";

interface PageProps {
  params: Promise<{ org: string; project: string }>;
}

export default async function NewFlagPage({ params }: PageProps) {
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

  // Check permission
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!["owner", "admin", "editor"].includes(membership?.role ?? "")) {
    redirect(`/${orgSlug}/${projectSlug}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <Link href={`/${orgSlug}/${projectSlug}`} className="hover:text-gray-900">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">新規フラグ</span>
      </nav>

      <NewFlagForm
        projectId={project.id}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
      />
    </div>
  );
}
