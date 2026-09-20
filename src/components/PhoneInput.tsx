"use client";

const COUNTRY_CODES = [
  { flag: "🇹🇬", code: "+228", label: "Togo" },
  { flag: "🇳🇪", code: "+227", label: "Niger" },
  { flag: "🇫🇷", code: "+33", label: "France" },
  { flag: "🇨🇮", code: "+225", label: "Côte d'Ivoire" },
  { flag: "🇸🇳", code: "+221", label: "Sénégal" },
  { flag: "🇲🇦", code: "+212", label: "Maroc" },
  { flag: "🇧🇯", code: "+229", label: "Bénin" },
  { flag: "🇬🇭", code: "+233", label: "Ghana" },
];

export default function PhoneInput({
  code,
  number,
  onCodeChange,
  onNumberChange,
}: {
  code: string;
  number: string;
  onCodeChange: (v: string) => void;
  onNumberChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="w-[118px] rounded-lg border border-line bg-surfaceSoft px-2 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder="90 12 34 56"
        className="flex-1 rounded-lg border border-line bg-surfaceSoft px-3 py-2.5 text-sm focus:border-green focus:bg-surface outline-none"
      />
    </div>
  );
}
