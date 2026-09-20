import { Resend } from "resend";
import { DossierStatus, STATUS_LABELS } from "./types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendStatusEmail(params: {
  to: string;
  trackingNumber: string;
  status: DossierStatus;
  motif?: string | null;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY absent — e-mail non envoyé (mode développement).");
    return;
  }

  const label = STATUS_LABELS[params.status];
  const motifLine = params.motif ? `\n\nMotif : ${params.motif}` : "";

  await resend.emails.send({
    from: "Suivi ANAB <notifications@votre-domaine.tg>",
    to: params.to,
    subject: `Mise à jour de votre dossier ${params.trackingNumber}`,
    text: `Votre dossier ${params.trackingNumber} est passé au statut : ${label}.${motifLine}`,
  });
}
