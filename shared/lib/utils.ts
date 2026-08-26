type ClassValue = string | number | boolean | null | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

function collectClassNames(value: ClassValue, output: string[]) {
  if (!value) return;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectClassNames(item, output));
    return;
  }
  Object.entries(value).forEach(([key, enabled]) => {
    if (enabled) output.push(key);
  });
}

/** Combina classes condicionais sem depender de bibliotecas de cada aplicação. */
export function cn(...inputs: ClassValue[]) {
  const output: string[] = [];
  inputs.forEach((input) => collectClassNames(input, output));
  return output.join(" ");
}
