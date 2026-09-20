import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendStatusEmail } from "@/lib/email";
import { DossierStatus } from "@/lib/types";

// Transitions autorisées par rôle — la règle métier vit ici, pas seulement côté UI
const ALLOWED_TRANSITIONS: Record<string, Record<DossierStatus, DossierStatus[]>> = {
  agent_embassy: {
    cree: ["recu_ambassade"],
    recu_ambassade: ["transmis_anab"],
    transmis_anab: [],
    en_examen: [],
    decision_favorable: [],
    decision_defavorable: [],
  },
  agent_anab: {
    cree: [],
    recu_ambassade: [],
    transmis_anab: ["en_examen"],
    en_examen: ["decision_favorable", "decision_defavorable"],
    decision_favorable: [],
    decision_defavorable: [],
  },
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role === "student") {
    return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const nextStatus: DossierStatus = body.status;
  const motif: string | undefined = body.motif;

  const { data: dossier } = await supabase.from("dossiers").select("*, users!dossiers_student_id_fkey(email)").eq("id", params.id).single();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[profile.role]?.[dossier.status as DossierStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json({ error: "Transition non autorisée pour ce rôle" }, { status: 403 });
  }

  if (nextStatus === "decision_defavorable" && !motif) {
    return NextResponse.json({ error: "Un motif est obligatoire pour un rejet" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("dossiers")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from("status_history").insert({
    dossier_id: params.id,
    status: nextStatus,
    changed_by: user.id,
    motif: motif ?? null,
  });

  const studentEmail = (dossier as any).users?.email;
  if (studentEmail) {
    await sendStatusEmail({
      to: studentEmail,
      trackingNumber: dossier.tracking_number,
      status: nextStatus,
      motif,
    });
  }

  return NextResponse.json({ success: true });
}
