import { nanoid } from "nanoid";
import { getDb } from "./db";
import type { Site } from "./types";

export function createSite(userId: string, name: string, domain: string): Site {
  const id = nanoid();
  const publicKey = `pk_${nanoid(24)}`;
  getDb()
    .prepare(
      "INSERT INTO sites (id, user_id, name, domain, public_key) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, userId, name, domain, publicKey);
  return getSiteById(id)!;
}

export function listSitesForUser(userId: string): Site[] {
  return getDb()
    .prepare("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Site[];
}

export function getSiteById(id: string): Site | undefined {
  return getDb().prepare("SELECT * FROM sites WHERE id = ?").get(id) as Site | undefined;
}

export function getSiteByPublicKey(publicKey: string): Site | undefined {
  return getDb()
    .prepare("SELECT * FROM sites WHERE public_key = ?")
    .get(publicKey) as Site | undefined;
}

/** Ownership check used before returning stats or letting a user manage a site. */
export function getOwnedSite(siteId: string, userId: string): Site | undefined {
  return getDb()
    .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
    .get(siteId, userId) as Site | undefined;
}
