"use client";

import { useCallback } from "react";

/**
 * Formata número de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Portado de formatPhoneValue() em src/js/main.js.
 */
export function formatPhoneValue(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function usePhoneMask() {
  const maskPhone = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = formatPhoneValue(e.target.value);
    },
    []
  );

  return { maskPhone };
}
