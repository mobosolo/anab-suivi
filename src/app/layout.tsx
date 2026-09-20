import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suivi ANAB",
  description: "Suivi de dossier de bourse — projet d'étude non officiel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-body">{children}</body>
    </html>
  );
}
