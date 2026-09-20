"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateTrackingNumber } from "@/lib/tracking";
import type { Establishment, AcademicYear, Embassy, DossierType } from "@/lib/types";

const DOSSIER_TYPES: { value: DossierType; label: string; desc: string; enabled: boolean }[] = [
  { value: "renouvellement", label: "Renouvellement de bourse", desc: "Vous êtes déjà boursier et poursuivez vos études", enabled: true },
  { value: "nouvelle_demande", label: "Nouvelle demande", desc: "1er, 2e, 3e cycle ou spécialisation", enabled: false },
  { value: "transfert", label: "Transfert de bourse", desc: "Changement d'établissement à l'étranger", enabled: false },
  { value: "activation", label: "Activation — nouveau bachelier", desc: "Première demande après le baccalauréat", enabled: false },
];

export default function NewDossierPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<DossierType>("renouvellement");

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [embassies, setEmbassies] = useState<Embassy[]>([]);

  const [establishmentId, setEstablishmentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [embassyId, setEmbassyId] = useState("");

  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReferenceData() {
      const [{ data: est }, { data: years }, { data: emb }] = await Promise.all([
        supabase.from("establishments").select("*").order("name"),
        supabase.from("academic_years").select("*").order("label"),
        supabase.from("embassies").select("*").order("name"),
      ]);
      if (est) setEstablishments(est);
      if (years) setAcademicYears(years);
      if (emb) setEmbassies(emb);
    }
    loadReferenceData();
  }, []);

  async function handleCreateDossier() {
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée, veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const tracking = generateTrackingNumber();

    const { error: insertError } = await supabase.from("dossiers").insert({
      tracking_number: tracking,
      student_id: user.id,
      type,
      establishment_id: establishmentId || null,
      academic_year_id: academicYearId || null,
      embassy_id: embassyId || null,
      status: "cree",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setTrackingNumber(tracking);
    setStep(3);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="bg-greenDeep text-white px-6 py-5">
          <h1 className="font-head font-bold text-lg">Nouveau dossier</h1>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-orange" : "bg-white/20"}`} />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-inkFaint mb-1">Étape 1 sur 3</p>
              <h2 className="font-head font-bold text-lg mb-4">Quel type de démarche ?</h2>
              <div className="space-y-2 mb-6">
                {DOSSIER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    disabled={!t.enabled}
                    onClick={() => setType(t.value)}
                    className={`w-full text-left flex items-start gap-3 rounded-xl border p-3.5 ${
                      type === t.value ? "border-green bg-greenSoft" : "border-line bg-surfaceSoft"
                    } ${!t.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${type === t.value ? "border-green bg-green" : "border-line"}`} />
                    <div>
                      <div className="font-head font-bold text-sm">{t.label}</div>
                      <div className="text-xs text-inkSoft">{t.desc}{!t.enabled && " — bientôt disponible"}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-green text-white font-head font-bold text-sm rounded-xl py-3">
                Continuer
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-inkFaint mb-1">Étape 2 sur 3</p>
              <h2 className="font-head font-bold text-lg mb-4">Vos informations</h2>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-inkSoft mb-1">Établissement</label>
                <select
                  value={establishmentId}
                  onChange={(e) => setEstablishmentId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner…</option>
                  {establishments.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-inkSoft mb-1">Année académique</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner…</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-inkSoft mb-1">Ambassade de dépôt</label>
                <select
                  value={embassyId}
                  onChange={(e) => setEmbassyId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner…</option>
                  {embassies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <p className="text-xs text-inkFaint mt-1.5">
                  Le dépôt physique de vos documents tamponnés reste nécessaire auprès de cette ambassade.
                </p>
              </div>

              {error && <p className="text-red text-sm mb-3">{error}</p>}

              <button
                disabled={loading || !establishmentId || !academicYearId || !embassyId}
                onClick={handleCreateDossier}
                className="w-full bg-green text-white font-head font-bold text-sm rounded-xl py-3 disabled:opacity-60"
              >
                {loading ? "Création…" : "Générer mon numéro de suivi"}
              </button>
              <button onClick={() => setStep(1)} className="w-full text-inkSoft font-head font-semibold text-sm py-2.5 mt-1">
                Retour
              </button>
            </>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-greenSoft flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1f6650" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-head font-extrabold text-lg mb-2">Dossier créé avec succès</h2>
              <p className="text-inkSoft text-sm mb-5">Conservez ce numéro pour suivre votre dossier.</p>

              <div className="bg-surfaceSoft border-2 border-dashed border-line rounded-2xl p-5 mb-5">
                <div className="text-xs font-bold uppercase tracking-wide text-inkFaint mb-1.5">Numéro de suivi</div>
                <div className="font-head font-extrabold text-2xl text-greenDeep">{trackingNumber}</div>
              </div>

              <div className="text-left bg-orangeSoft rounded-xl p-4 text-sm mb-5">
                <strong className="block text-orange font-head mb-1">Prochaine étape</strong>
                Déposez vos documents tamponnés et légalisés à l&apos;ambassade choisie. L&apos;agent
                rattachera votre dossier physique à ce numéro de suivi.
              </div>

              <button onClick={() => router.push("/dashboard")} className="w-full bg-green text-white font-head font-bold text-sm rounded-xl py-3">
                Voir mon dossier
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
