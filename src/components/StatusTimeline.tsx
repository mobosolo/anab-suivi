import { DossierStatus, STATUS_LABELS, StatusHistoryEntry } from "@/lib/types";

const FLOW: DossierStatus[] = ["cree", "recu_ambassade", "transmis_anab", "en_examen"];

export default function StatusTimeline({
  currentStatus,
  history,
}: {
  currentStatus: DossierStatus;
  history: StatusHistoryEntry[];
}) {
  const isRejected = currentStatus === "decision_defavorable";
  const isAccepted = currentStatus === "decision_favorable";
  const isDecided = isRejected || isAccepted;

  const currentIndex = isDecided ? FLOW.length : FLOW.indexOf(currentStatus);

  function findDate(status: DossierStatus) {
    const entry = history.find((h) => h.status === status);
    return entry ? new Date(entry.changed_at).toLocaleString("fr-FR") : null;
  }

  const steps = [...FLOW, isRejected ? "decision_defavorable" : "decision_favorable"] as DossierStatus[];

  return (
    <div>
      {steps.map((status, i) => {
        const done = i < currentIndex || (isDecided && i === steps.length - 1);
        const current = i === currentIndex && !isDecided;
        const upcoming = !done && !current;
        const date = findDate(status);
        const motif = history.find((h) => h.status === status)?.motif;

        return (
          <div key={status} className="flex gap-3.5">
            <div className="flex flex-col items-center w-[22px]">
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  done
                    ? status === "decision_defavorable"
                      ? "bg-red border-red"
                      : "bg-green border-green"
                    : current
                    ? "bg-orange border-orange"
                    : "bg-surfaceSoft border-line"
                }`}
              >
                {done && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {current && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 flex-1 my-0.5 ${done ? "bg-green" : "bg-line"}`} />
              )}
            </div>
            <div className="pb-6 flex-1">
              <div className={`font-head font-bold text-sm ${upcoming ? "text-inkFaint" : "text-ink"}`}>
                {STATUS_LABELS[status]}
              </div>
              <div className={`text-xs ${upcoming ? "text-inkFaint" : "text-inkSoft"}`}>
                {date ?? "En attente"}
              </div>
              {motif && (
                <div className="text-sm text-inkSoft bg-surfaceSoft rounded-lg p-2.5 mt-1.5">
                  Motif : {motif}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
