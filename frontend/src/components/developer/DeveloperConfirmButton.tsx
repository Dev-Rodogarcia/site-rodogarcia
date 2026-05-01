"use client";

import { useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  developerDangerButtonClassName,
  developerGhostButtonClassName,
} from "./ui";

interface DeveloperConfirmButtonProps {
  children: ReactNode;
  message: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function DeveloperConfirmButton({
  children,
  message,
  onConfirm,
  className,
  disabled,
}: DeveloperConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={cn(developerGhostButtonClassName, "px-3")}
        >
          <X size={16} weight="bold" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={async () => {
            await onConfirm();
            setConfirming(false);
          }}
          className={cn(developerDangerButtonClassName, "px-3")}
        >
          {message}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setConfirming(true)}
      className={cn(developerDangerButtonClassName, className)}
    >
      {children}
    </button>
  );
}
