import path from "node:path";
import net from "node:net";

export function sanitizeText(value: unknown, maxLength = 240): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: unknown): string {
  const email = sanitizeText(value, 160).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function sanitizeUrl(value: unknown): string {
  const raw = sanitizeText(value, 600);
  if (!raw) return "";
  if (raw.startsWith("/")) {
    return sanitizePath(raw);
  }
  try {
    const url = new URL(raw);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

export function sanitizePath(value: unknown): string {
  const raw = sanitizeText(value, 400);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "";
  const normalized = path.posix.normalize(raw.replace(/\\/g, "/"));
  if (!normalized.startsWith("/") || normalized.includes("..")) return "";
  return normalized;
}

export function sanitizeHexColor(value: unknown): string {
  const raw = sanitizeText(value, 16);
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "";
}

export function maskIpAddress(value: unknown): string {
  const ip = sanitizeText(value, 80);
  if (!ip || ip === "unknown") return "";

  if (net.isIP(ip) === 4) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.0.0`;
  }

  if (net.isIP(ip) === 6) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::`;
  }

  return "";
}
