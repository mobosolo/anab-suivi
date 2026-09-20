/**
 * Génère un numéro de suivi au format ANAB-{année}-{6 chiffres}
 * Unicité garantie côté base par la contrainte UNIQUE sur tracking_number ;
 * en cas de collision (très rare), relancer l'insertion.
 */
export function generateTrackingNumber(year: number = new Date().getFullYear()): string {
  const suffix = Math.floor(100000 + Math.random() * 900000); // 6 chiffres
  return `ANAB-${year}-${suffix}`;
}
