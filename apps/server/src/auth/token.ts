import { createHash, randomBytes } from "node:crypto";

/**
 * 32 bytes, base64url — goes straight into the magic-link URL (§4.4).
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Only this hash is ever stored — a database leak yields nothing usable (§4.4).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
