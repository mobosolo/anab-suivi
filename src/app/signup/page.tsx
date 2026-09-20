"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PhoneInput from "@/components/PhoneInput";

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneCode, setPhoneCode] = useState("+228");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_code: phoneCode,
          phone_number: phoneNumber,
        },
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="font-head font-bold text-xl mb-3">Vérifiez votre e-mail</h1>
          <p className="text-inkSoft text-sm">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus
            pour activer votre compte, puis connectez-vous.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface border border-line rounded-2xl p-6"
      >
        <h1 className="font-head font-extrabold text-xl mb-1">Créer un compte</h1>
        <p className="text-inkSoft text-sm mb-6">Accessible depuis n&apos;importe quel pays.</p>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-inkSoft mb-1">Nom complet</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-inkSoft mb-1">Adresse e-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-inkSoft mb-1">Numéro de téléphone</label>
          <PhoneInput code={phoneCode} number={phoneNumber} onCodeChange={setPhoneCode} onNumberChange={setPhoneNumber} />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-inkSoft mb-1">Mot de passe</label>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
          />
        </div>

        {error && <p className="text-red text-sm mb-4">{error}</p>}

        <button disabled={loading} className="w-full bg-green text-white font-head font-bold text-sm rounded-xl py-3 disabled:opacity-60">
          {loading ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-inkSoft mt-4">
          Déjà inscrit ?{" "}
          <a href="/login" className="text-green font-semibold">Se connecter</a>
        </p>
      </form>
    </main>
  );
}
