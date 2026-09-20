import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const values = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) values[match[1].trim()] = match[2].trim();
  }
  return values;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { email: "etudiant.demo2@anab-suivi.com", password: "Demo1234!", role: "student", full_name: "Amina Etudiante", phone_code: "+227", phone_number: "90123456" },
  { email: "ambassade.demo2@anab-suivi.com", password: "Demo1234!", role: "agent_embassy", full_name: "Agent Ambassade Lome", phone_code: "+228", phone_number: "91234567" },
  { email: "anab.demo2@anab-suivi.com", password: "Demo1234!", role: "agent_anab", full_name: "Agent ANAB Demo", phone_code: "+227", phone_number: "92345678" },
];

async function checked(operation, promise) {
  const { data, error } = await promise;
  if (error) throw new Error(`${operation}: ${error.message}`);
  return data;
}

async function ensureReference(table, column, value, row) {
  const existing = await checked(`Lecture ${table}`, supabase.from(table).select("id").eq(column, value).maybeSingle());
  if (existing) return existing.id;
  const inserted = await checked(`Insertion ${table}`, supabase.from(table).insert(row).select("id").single());
  return inserted.id;
}

const countryIds = {};
for (const country of [
  ["Togo", "TG", "+228"], ["Niger", "NE", "+227"], ["France", "FR", "+33"],
  ["Cote d'Ivoire", "CI", "+225"], ["Senegal", "SN", "+221"], ["Maroc", "MA", "+212"],
  ["Benin", "BJ", "+229"], ["Ghana", "GH", "+233"],
]) {
  countryIds[country[1]] = await ensureReference("countries", "iso_code", country[1], {
    name: country[0], iso_code: country[1], dial_code: country[2],
  });
}

const yearIds = {};
for (const label of ["2024/2025", "2025/2026", "2026/2027"]) {
  yearIds[label] = await ensureReference("academic_years", "label", label, { label });
}

const embassyIds = {};
for (const embassy of [
  ["Ambassade du Niger - Lome", "Lome", "TG"],
  ["Ambassade du Niger - Rabat", "Rabat", "MA"],
  ["Ambassade du Niger - Dakar", "Dakar", "SN"],
  ["Ambassade du Niger - Paris", "Paris", "FR"],
]) {
  embassyIds[embassy[0]] = await ensureReference("embassies", "name", embassy[0], {
    name: embassy[0], city: embassy[1], country_id: countryIds[embassy[2]],
  });
}

const establishmentIds = {};
for (const establishment of [
  ["Universite de Lome", "TG"], ["Universite de Kara", "TG"], ["IAI Togo", "TG"],
  ["Universite Abdou Moumouni", "NE"], ["Universite de Niamey", "NE"],
]) {
  establishmentIds[establishment[0]] = await ensureReference("establishments", "name", establishment[0], {
    name: establishment[0], country_id: countryIds[establishment[1]],
  });
}

const users = {};
const demoEmails = accounts.map((account) => account.email);
const existingProfiles = await checked("Recherche des profils demo existants", supabase.from("users").select("id, email").in("email", demoEmails));
const existingProfileIds = existingProfiles.map((profile) => profile.id);
if (existingProfileIds.length) {
  const existingDossiers = await checked("Recherche des dossiers des comptes demo", supabase.from("dossiers").select("id").in("student_id", existingProfileIds));
  if (existingDossiers.length) {
    const dossierIds = existingDossiers.map((dossier) => dossier.id);
    await checked("Suppression des historiques des comptes demo", supabase.from("status_history").delete().in("dossier_id", dossierIds));
    await checked("Suppression des notifications des comptes demo", supabase.from("notifications").delete().in("dossier_id", dossierIds));
    await checked("Suppression des dossiers des comptes demo", supabase.from("dossiers").delete().in("id", dossierIds));
  }
  await checked("Suppression des notifications des utilisateurs demo", supabase.from("notifications").delete().in("user_id", existingProfileIds));
  for (const profileId of existingProfileIds) {
    await checked("Suppression du compte Auth demo", supabase.auth.admin.deleteUser(profileId));
  }
}

for (const account of accounts) {
  const created = await checked(`Creation du compte ${account.email}`, supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.full_name },
  }));
  const authUser = created.user;
  users[account.email] = authUser.id;
  await checked(`Profil ${account.email}`, supabase.from("users").upsert({
    id: authUser.id,
    role: account.role,
    email: account.email,
    phone_code: account.phone_code,
    phone_number: account.phone_number,
    full_name: account.full_name,
    embassy_id: account.role === "agent_embassy" ? embassyIds["Ambassade du Niger - Lome"] : null,
  }));
}

const studentId = users[accounts[0].email];
const embassyAgentId = users[accounts[1].email];
const anabAgentId = users[accounts[2].email];
const trackingNumbers = ["ANAB-DEMO-000001", "ANAB-DEMO-000002", "ANAB-DEMO-000003", "ANAB-DEMO-000004", "ANAB-DEMO-000005", "ANAB-DEMO-000006"];

const oldDossiers = await checked("Recherche des anciens dossiers demo", supabase.from("dossiers").select("id").in("tracking_number", trackingNumbers));
if (oldDossiers.length) {
  await checked("Suppression des historiques demo", supabase.from("status_history").delete().in("dossier_id", oldDossiers.map((row) => row.id)));
  await checked("Suppression des notifications demo", supabase.from("notifications").delete().in("dossier_id", oldDossiers.map((row) => row.id)));
  await checked("Suppression des dossiers demo", supabase.from("dossiers").delete().in("id", oldDossiers.map((row) => row.id)));
}

const dossierDefinitions = [
  ["ANAB-DEMO-000001", "Universite de Lome", "2026/2027", "cree"],
  ["ANAB-DEMO-000002", "Universite de Kara", "2026/2027", "recu_ambassade"],
  ["ANAB-DEMO-000003", "IAI Togo", "2026/2027", "transmis_anab"],
  ["ANAB-DEMO-000004", "Universite Abdou Moumouni", "2025/2026", "en_examen"],
  ["ANAB-DEMO-000005", "Universite de Niamey", "2025/2026", "decision_favorable"],
  ["ANAB-DEMO-000006", "Universite de Lome", "2024/2025", "decision_defavorable"],
];

const dossiers = {};
for (const [tracking_number, establishment, year, status] of dossierDefinitions) {
  const inserted = await checked(`Dossier ${tracking_number}`, supabase.from("dossiers").insert({
    tracking_number,
    student_id: studentId,
    type: "renouvellement",
    establishment_id: establishmentIds[establishment],
    academic_year_id: yearIds[year],
    embassy_id: embassyIds["Ambassade du Niger - Lome"],
    status,
  }).select("id").single());
  dossiers[tracking_number] = inserted.id;
}

const histories = [
  ["ANAB-DEMO-000001", "cree", studentId, null],
  ["ANAB-DEMO-000002", "cree", studentId, null], ["ANAB-DEMO-000002", "recu_ambassade", embassyAgentId, null],
  ["ANAB-DEMO-000003", "cree", studentId, null], ["ANAB-DEMO-000003", "recu_ambassade", embassyAgentId, null], ["ANAB-DEMO-000003", "transmis_anab", embassyAgentId, null],
  ["ANAB-DEMO-000004", "cree", studentId, null], ["ANAB-DEMO-000004", "recu_ambassade", embassyAgentId, null], ["ANAB-DEMO-000004", "transmis_anab", embassyAgentId, null], ["ANAB-DEMO-000004", "en_examen", anabAgentId, null],
  ["ANAB-DEMO-000005", "cree", studentId, null], ["ANAB-DEMO-000005", "recu_ambassade", embassyAgentId, null], ["ANAB-DEMO-000005", "transmis_anab", embassyAgentId, null], ["ANAB-DEMO-000005", "en_examen", anabAgentId, null], ["ANAB-DEMO-000005", "decision_favorable", anabAgentId, null],
  ["ANAB-DEMO-000006", "cree", studentId, null], ["ANAB-DEMO-000006", "recu_ambassade", embassyAgentId, null], ["ANAB-DEMO-000006", "transmis_anab", embassyAgentId, null], ["ANAB-DEMO-000006", "en_examen", anabAgentId, null], ["ANAB-DEMO-000006", "decision_defavorable", anabAgentId, "Pieces justificatives insuffisantes pour le renouvellement."],
];
await checked("Insertion des historiques", supabase.from("status_history").insert(histories.map(([tracking, status, changed_by, motif]) => ({ dossier_id: dossiers[tracking], status, changed_by, motif }))));

await checked("Insertion des notifications", supabase.from("notifications").insert([
  ["ANAB-DEMO-000003", "Votre dossier ANAB-DEMO-000003 a ete transmis a l'ANAB."],
  ["ANAB-DEMO-000004", "Votre dossier ANAB-DEMO-000004 est en cours d'examen."],
  ["ANAB-DEMO-000005", "La decision pour votre dossier ANAB-DEMO-000005 est favorable."],
  ["ANAB-DEMO-000006", "La decision pour votre dossier ANAB-DEMO-000006 est defavorable."],
].map(([tracking_number, message]) => ({ user_id: studentId, dossier_id: dossiers[tracking_number], message, channel: "email" }))));

console.log("Seed demo termine.");
console.log("Etudiant : etudiant.demo2@anab-suivi.com / Demo1234!");
console.log("Ambassade : ambassade.demo2@anab-suivi.com / Demo1234!");
console.log("ANAB : anab.demo2@anab-suivi.com / Demo1234!");
