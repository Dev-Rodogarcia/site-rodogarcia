"use client";

import { DeveloperMediaField } from "./DeveloperMediaField";

interface DeveloperImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  tooltip?: string;
  previewAlt?: string;
  className?: string;
}

export function DeveloperImageField(props: DeveloperImageFieldProps) {
  return <DeveloperMediaField {...props} mediaType="image" />;
}
