import { hash } from "bcrypt";

/**
 * Hash a password with bcrypt
 * @param password The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}
