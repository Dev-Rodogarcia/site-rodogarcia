import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (typeof storedHash !== "string") return false;

  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    const salt = parts[2];
    const hashHex = parts[3];
    if (!iterations || !salt || !hashHex) return false;

    const candidate = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");
    const bufA = Buffer.from(candidate);
    const bufB = Buffer.from(hashHex);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  return bcrypt.compareSync(password, storedHash);
}

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push("A senha deve ter no minimo 10 caracteres.");
  if (password.length > 72) errors.push("A senha deve ter no maximo 72 caracteres.");
  if (!/[a-z]/.test(password)) errors.push("A senha deve incluir letra minuscula.");
  if (!/[A-Z]/.test(password)) errors.push("A senha deve incluir letra maiuscula.");
  if (!/[0-9]/.test(password)) errors.push("A senha deve incluir numero.");
  return errors;
}
