"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-line rounded-2xl p-6">
        <h1 className="font-head font-extrabold text-xl mb-1">Se connecter</h1>
        <p className="text-inkSoft text-sm mb-6">Suivez votre dossier de bourse.</p>

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

        <div className="mb-5">
          <label className="block text-xs font-semibold text-inkSoft mb-1">Mot de passe</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
          />
        </div>

        {error && <p className="text-red text-sm mb-4">{error}</p>}

        <button disabled={loading} className="w-full bg-green text-white font-head font-bold text-sm rounded-xl py-3 disabled:opacity-60">
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-center text-sm text-inkSoft mt-4">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-green font-semibold">Créer un compte</a>
        </p>
      </form>
    </main>
  );
}
