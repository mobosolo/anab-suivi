import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusTimeline from "@/components/StatusTimeline";
import { STATUS_LABELS, DossierStatus } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("*, establishments(name), embassies(name), academic_years(label)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (!dossiers || dossiers.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-head font-bold text-lg mb-2">Aucun dossier pour l&apos;instant</h1>
          <p className="text-inkSoft text-sm mb-5">Créez votre premier dossier pour obtenir un numéro de suivi.</p>
          <Link href="/dossier/new" className="inline-block bg-green text-white font-head font-bold text-sm rounded-xl py-3 px-6">
            Créer un dossier
          </Link>
        </div>
      </main>
    );
  }

  const dossier = dossiers[0];

  const { data: history } = await supabase
    .from("status_history")
    .select("*")
    .eq("dossier_id", dossier.id)
    .order("changed_at", { ascending: true });

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, message, sent_at, read_at")
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(10);

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="bg-greenDeep text-white rounded-2xl px-5 py-5 mb-4">
        <div className="text-xs text-[#c9e2d5] mb-1">Bonjour,</div>
        <div className="font-head font-bold text-xl">{user.email}</div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-inkFaint font-semibold mb-0.5">
              {dossier.type === "renouvellement" ? "Renouvellement de bourse" : dossier.type}
            </div>
            <div className="font-head font-extrabold text-lg">{dossier.tracking_number}</div>
          </div>
          <span className="text-xs font-head font-bold px-2.5 py-1 rounded-full bg-orangeSoft text-orange whitespace-nowrap">
            {STATUS_LABELS[dossier.status as DossierStatus]}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-inkSoft pt-3 border-t border-dashed border-line">
          <div>
            <span className="block text-inkFaint mb-0.5">Établissement</span>
            {dossier.establishments?.name ?? "—"}
          </div>
          <div>
            <span className="block text-inkFaint mb-0.5">Année</span>
            {dossier.academic_years?.label ?? "—"}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4">
        <h2 className="font-head font-bold text-sm mb-3">Progression du dossier</h2>
        <StatusTimeline currentStatus={dossier.status as DossierStatus} history={(history as any) ?? []} />
      </div>

      {notifications && notifications.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl p-4 mt-4">
          <h2 className="font-head font-bold text-sm mb-3">Notifications</h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-surfaceSoft rounded-lg p-3 text-sm text-inkSoft">
                {notification.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
