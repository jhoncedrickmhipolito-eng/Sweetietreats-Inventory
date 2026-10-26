import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "./db";

/** Code that unlocks the change-password form. */
export const ADMIN_CODE = process.env.ADMIN_CODE ?? "0987";

/**
 * Default password used until the owner sets their own one
 * via the change-password form (code 0987).
 */
const DEFAULT_PASSWORD = "0987";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const derived = scryptSync(password, salt, 64);
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

/** Returns the stored hash, creating the default one on first use. */
export async function getOrCreatePasswordHash(): Promise<string> {
  const existing = await prisma.authSetting.findFirst();
  if (existing) return existing.passwordHash;
  const created = await prisma.authSetting.create({
    data: { passwordHash: hashPassword(DEFAULT_PASSWORD) },
  });
  return created.passwordHash;
}

export async function checkPassword(password: string): Promise<boolean> {
  const hash = await getOrCreatePasswordHash();
  return verifyPassword(password, hash);
}

export async function setPassword(password: string): Promise<void> {
  const hash = hashPassword(password);
  const existing = await prisma.authSetting.findFirst();
  if (existing) {
    await prisma.authSetting.update({
      where: { id: existing.id },
      data: { passwordHash: hash },
    });
  } else {
    await prisma.authSetting.create({ data: { passwordHash: hash } });
  }
}
