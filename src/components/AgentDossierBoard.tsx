"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS, DossierStatus, UserRole } from "@/lib/types";

interface DossierRow {
  id: string;
  tracking_number: string;
  type: string;
  status: DossierStatus;
  users: { full_name: string } | null;
  establishments: { name: string } | null;
  academic_years: { label: string } | null;
  created_at: string;
}

const NEXT_ACTION: Record<UserRole, Partial<Record<DossierStatus, { label: string; next: DossierStatus }>>> = {
  agent_embassy: {
    cree: { label: "Marquer comme reçu par l'ambassade", next: "recu_ambassade" },
    recu_ambassade: { label: "Marquer comme transmis à l'ANAB", next: "transmis_anab" },
  },
  agent_anab: {
    transmis_anab: { label: "Faire passer en cours d'examen", next: "en_examen" },
  },
  student: {},
};

export default function AgentDossierBoard({ role, initialDossiers }: { role: UserRole; initialDossiers: DossierRow[] }) {
  const supabase = createClient();
  const [dossiers, setDossiers] = useState(initialDossiers);
  const [selectedId, setSelectedId] = useState(initialDossiers[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [motif, setMotif] = useState("");
  const [showMotif, setShowMotif] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selected = dossiers.find((d) => d.id === selectedId) ?? null;

  const filtered = dossiers.filter(
    (d) =>
      d.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      d.users?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function advance(status: DossierStatus, motifValue?: string) {
    if (!selected) return;
    const res = await fetch(`/api/dossiers/${selected.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, motif: motifValue }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast(json.error ?? "Erreur");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setDossiers((prev) => prev.map((d) => (d.id === selected.id ? { ...d, status } : d)));
    setShowMotif(false);
    setMotif("");
    setToast("Statut mis à jour — étudiant notifié");
    setTimeout(() => setToast(null), 3000);
  }

  const anabAction = selected?.status === "en_examen";

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="bg-greenDeep text-white rounded-2xl px-5 py-4 mb-4 flex justify-between items-center">
        <div className="font-head font-extrabold">Suivi ANAB</div>
        <div className="text-xs bg-white/10 rounded-full px-3 py-1.5">
          {role === "agent_embassy" ? "Espace ambassade" : "Espace ANAB"}
        </div>
      </div>

      <input
        placeholder="Rechercher par numéro de suivi ou nom…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm mb-4"
      />

      <div className="grid md:grid-cols-[1.15fr_1fr] gap-4 items-start">
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-0 ${
                d.id === selectedId ? "bg-greenSoft" : "hover:bg-surfaceSoft"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-head font-bold text-sm truncate">{d.users?.full_name ?? "—"}</div>
                <div className="text-xs text-inkFaint truncate">{d.tracking_number} · {d.type}</div>
              </div>
              <span className="text-xs font-head font-bold px-2.5 py-1 rounded-full bg-orangeSoft text-orange whitespace-nowrap">
                {STATUS_LABELS[d.status]}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <div className="p-4 text-sm text-inkFaint">Aucun dossier.</div>}
        </div>

        {selected && (
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-head font-extrabold text-lg">{selected.users?.full_name}</div>
                <div className="text-xs text-inkFaint">{selected.tracking_number} · {selected.type}</div>
              </div>
              <span className="text-xs font-head font-bold px-2.5 py-1 rounded-full bg-orangeSoft text-orange">
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-surfaceSoft rounded-lg p-3.5 mb-4 text-sm">
              <div>
                <div className="text-xs text-inkFaint uppercase mb-0.5">Établissement</div>
                {selected.establishments?.name ?? "—"}
              </div>
              <div>
                <div className="text-xs text-inkFaint uppercase mb-0.5">Année</div>
                {selected.academic_years?.label ?? "—"}
              </div>
            </div>

            <div className="font-head font-bold text-sm mb-2">Action</div>

            {NEXT_ACTION[role][selected.status] && (
              <button
                onClick={() => advance(NEXT_ACTION[role][selected.status]!.next)}
                className="w-full bg-green text-white font-head font-bold text-sm rounded-lg py-3 mb-2"
              >
                {NEXT_ACTION[role][selected.status]!.label}
              </button>
            )}

            {anabAction && (
              <>
                <button
                  onClick={() => advance("decision_favorable")}
                  className="w-full bg-green text-white font-head font-bold text-sm rounded-lg py-3 mb-2"
                >
                  Valider — accorder la bourse
                </button>
                <button
                  onClick={() => setShowMotif(true)}
                  className="w-full border border-red text-red bg-redSoft font-head font-bold text-sm rounded-lg py-3"
                >
                  Rejeter le dossier
                </button>
                {showMotif && (
                  <div className="mt-3">
                    <textarea
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Motif du rejet (visible par l'étudiant)…"
                      className="w-full rounded-lg border border-line bg-surfaceSoft p-2.5 text-sm mb-2"
                      rows={3}
                    />
                    <button
                      onClick={() => advance("decision_defavorable", motif)}
                      disabled={!motif}
                      className="w-full bg-red text-white font-head font-bold text-sm rounded-lg py-2.5 disabled:opacity-50"
                    >
                      Confirmer le rejet
                    </button>
                  </div>
                )}
              </>
            )}

            {!NEXT_ACTION[role][selected.status] && !anabAction && (
              <p className="text-sm text-inkFaint">Aucune action disponible pour ce rôle sur ce dossier.</p>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-greenDeep text-white text-sm font-head font-semibold px-5 py-2.5 rounded-full">
          {toast}
        </div>
      )}
    </div>
  );
}
