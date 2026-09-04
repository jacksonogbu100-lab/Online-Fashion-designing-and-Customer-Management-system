import bcrypt from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function passwordMatches(plain: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}
