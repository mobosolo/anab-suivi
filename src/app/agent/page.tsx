import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgentDossierBoard from "@/components/AgentDossierBoard";

export default async function AgentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role, embassy_id").eq("id", user.id).single();
  if (!profile || profile.role === "student") redirect("/dashboard");

  let query = supabase
    .from("dossiers")
    .select("id, tracking_number, type, status, created_at, users!dossiers_student_id_fkey(full_name), establishments(name), academic_years(label)")
    .order("created_at", { ascending: false });

  if (profile.role === "agent_embassy") {
    query = query.in("status", ["cree", "recu_ambassade"]);
    if (profile.embassy_id) query = query.eq("embassy_id", profile.embassy_id);
  } else {
    query = query.in("status", ["transmis_anab", "en_examen", "decision_favorable", "decision_defavorable"]);
  }

  const { data: dossiers } = await query;

  return <AgentDossierBoard role={profile.role} initialDossiers={(dossiers as any) ?? []} />;
}
