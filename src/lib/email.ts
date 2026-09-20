import { Resend } from "resend";
import { DossierStatus, STATUS_LABELS } from "./types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function sendStatusEmail(params: {
  to: string;
  trackingNumber: string;
  status: DossierStatus;
  motif?: string | null;
}) {
  if (!resend || !fromEmail) {
    console.warn("RESEND_API_KEY ou RESEND_FROM_EMAIL absent — e-mail non envoyé.");
    return;
  }

  const label = STATUS_LABELS[params.status];
  const motifLine = params.motif ? `\n\nMotif : ${params.motif}` : "";

  await resend.emails.send({
    from: `Suivi ANAB <${fromEmail}>`,
    to: params.to,
    subject: `Mise à jour de votre dossier ${params.trackingNumber}`,
    text: `Votre dossier ${params.trackingNumber} est passé au statut : ${label}.${motifLine}`,
  });
}
