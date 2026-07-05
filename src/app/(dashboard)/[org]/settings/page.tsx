import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrgSettingsClient from "@/components/dashboard/OrgSettingsClient";

interface PageProps {
  params: Promise<{ org: string }>;
}

export default async function OrgSettingsPage({ params }: PageProps) {
  const { org: orgSlug } = await params;

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

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!["owner", "admin"].includes(membership?.role ?? "")) {
    redirect("/dashboard");
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", org.id);

  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900">設定</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-6">組織設定</h1>

      <OrgSettingsClient
        org={org}
        members={members ?? []}
        apiKeys={apiKeys ?? []}
        orgSlug={orgSlug}
      />
    </div>
  );
}
