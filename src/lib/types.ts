export type UserRole = "student" | "agent_embassy" | "agent_anab";

export type DossierStatus =
  | "cree"
  | "recu_ambassade"
  | "transmis_anab"
  | "en_examen"
  | "decision_favorable"
  | "decision_defavorable";

export type DossierType =
  | "renouvellement"
  | "nouvelle_demande"
  | "transfert"
  | "activation";

export interface AppUser {
  id: string;
  role: UserRole;
  email: string;
  phone_code: string | null;
  phone_number: string | null;
  full_name: string;
  embassy_id: string | null;
}

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  dial_code: string;
}

export interface Establishment {
  id: string;
  name: string;
  country_id: string;
}

export interface AcademicYear {
  id: string;
  label: string;
}

export interface Embassy {
  id: string;
  name: string;
  city: string;
  country_id: string;
}

export interface Dossier {
  id: string;
  tracking_number: string;
  student_id: string;
  type: DossierType;
  establishment_id: string | null;
  academic_year_id: string | null;
  embassy_id: string | null;
  status: DossierStatus;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  dossier_id: string;
  status: DossierStatus;
  changed_by: string | null;
  motif: string | null;
  changed_at: string;
}

export const STATUS_LABELS: Record<DossierStatus, string> = {
  cree: "Dossier créé",
  recu_ambassade: "Reçu par l'ambassade",
  transmis_anab: "Transmis à l'ANAB",
  en_examen: "En cours d'examen",
  decision_favorable: "Bourse accordée",
  decision_defavorable: "Rejeté",
};

export const STATUS_ORDER: DossierStatus[] = [
  "cree",
  "recu_ambassade",
  "transmis_anab",
  "en_examen",
  "decision_favorable", // placeholder position; decision_defavorable handled separately
];
