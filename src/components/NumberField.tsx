"use client";

import { useState } from "react";

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

// Numeric input that keeps a local string draft while focused, so the field can
// be cleared and retyped without snapping back to a stuck "0". It selects its
// contents on focus (the first keystroke replaces a prefilled value) and clamps
// the committed number to [min, max]. The parent always holds a real number;
// the draft only governs what is shown mid-edit.
export default function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (Number.isFinite(value) ? String(value) : "");

  const commit = (raw: string) => {
    setDraft(raw);
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) {
      onChange(0);
      return;
    }
    let clamped = n;
    if (min != null) clamped = Math.max(min, clamped);
    if (max != null) clamped = Math.min(max, clamped);
    onChange(clamped);
  };

  return (
    <label className="block">
      <span className="fld-label">{label}</span>
      <input
        // A text input (with a decimal keypad on mobile) rather than
        // type="number": React's controlled-number reconciliation skips
        // rewriting the DOM when a clamped value differs from the typed text,
        // which would leave an out-of-range entry visible after blur. Range
        // enforcement happens in commit() instead.
        type="text"
        inputMode="decimal"
        className="fld numeric"
        value={display}
        onFocus={(e) => {
          setDraft(String(value));
          e.target.select();
        }}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}
