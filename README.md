# Suivi ANAB — V1 (renouvellement)

Prototype fonctionnel de suivi de dossier de bourse, construit à partir du cadrage validé
(voir le brief technique fourni séparément). Seul le flux **renouvellement** est
opérationnel de bout en bout ; les autres types de démarche apparaissent en liste mais
affichent "bientôt disponible".

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseignez `.env.local` avec les clés de votre projet Supabase (Project Settings > API)
et votre clé Resend (optionnelle pour tester en local — sans elle, les e-mails sont
simplement journalisés dans la console).

## Base de données

Dans l'éditeur SQL de votre projet Supabase, exécutez dans l'ordre :

1. `supabase/schema.sql` — tables, contraintes, Row Level Security
2. `supabase/seed.sql` — données de référence de départ (pays, établissements, années, ambassades)

Pour créer un compte **agent** (impossible via le formulaire d'inscription public,
volontairement réservé aux étudiants), insérez manuellement après avoir créé
l'utilisateur via Supabase Auth :

```sql
insert into users (id, role, email, full_name, embassy_id)
values ('<uuid-auth-user>', 'agent_embassy', 'agent@example.com', 'Agent Lomé',
        (select id from embassies where city = 'Lomé'));
```//' remplacer 'agent_embassy' par 'agent_anab' pour un agent ANAB.

## Lancer le projet

```bash
npm run dev
```

Ouvrez http://localhost:3000. Un étudiant non connecté est redirigé vers `/signup`.

## Creer les comptes et donnees de demonstration

Pour creer automatiquement les comptes Auth, les profils, les dossiers, les historiques
et les notifications de demonstration, ajoutez la cle `service_role` de Supabase dans
`.env.local` (Project Settings > API) :

```env
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

Ne partagez jamais cette cle et ne la mettez jamais dans une variable `NEXT_PUBLIC_`.
Puis executez :

```bash
npm run seed:demo
```

Comptes crees :

- `etudiant.demo2@anab-suivi.com` / `Demo1234!`
- `ambassade.demo2@anab-suivi.com` / `Demo1234!`
- `anab.demo2@anab-suivi.com` / `Demo1234!`

## Ce qui est fonctionnel

- Inscription avec téléphone international (sélecteur d'indicatif) et vérification e-mail
- Création de dossier avec listes déroulantes contrôlées (établissement, année, ambassade)
- Génération d'un numéro de suivi unique (`ANAB-{année}-{6 chiffres}`)
- Tableau de bord étudiant avec timeline de statut en temps réel
- Espace agent (ambassade / ANAB) avec transitions de statut limitées par rôle
- Motif obligatoire pour tout rejet, visible par l'étudiant
- Notification e-mail à chaque changement de statut (via Resend)

## Ce qui reste à faire (hors scope V1, voir brief technique)

- Téléversement de documents
- Pré-contrôle visuel des tampons
- Formulaires dynamiques pour les 3 autres types de démarche
- Vérification SMS
