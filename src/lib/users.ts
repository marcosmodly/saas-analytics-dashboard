import { nanoid } from "nanoid";
import { getDb } from "./db";
import type { User } from "./types";

export function findUserByEmail(email: string): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function createUser(email: string, passwordHash: string): User {
  const id = nanoid();
  const normalizedEmail = email.toLowerCase().trim();
  getDb()
    .prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)")
    .run(id, normalizedEmail, passwordHash);
  return findUserById(id)!;
}
