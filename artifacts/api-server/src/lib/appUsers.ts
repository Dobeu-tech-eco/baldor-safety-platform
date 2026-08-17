import { db, appUsersTable, type AppUser } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}

/**
 * Load or provision the app_users row for the authenticated user.
 * - First user ever becomes admin + allowlisted.
 * - A pre-allowlisted email row (no auth_user_id yet) is claimed on first login.
 */
export async function getOrCreateAppUser(authUser: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}): Promise<AppUser> {
  const existing = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.auth_user_id, authUser.id))
    .limit(1);
  if (existing[0]) return existing[0];

  const email = (authUser.email ?? "").toLowerCase().trim();
  const fullName = [authUser.firstName, authUser.lastName]
    .filter(Boolean)
    .join(" ");

  // Claim a pre-allowlisted email row if one exists.
  if (email) {
    const byEmail = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.email, email))
      .limit(1);
    if (byEmail[0] && !byEmail[0].auth_user_id) {
      const [claimed] = await db
        .update(appUsersTable)
        .set({ auth_user_id: authUser.id, full_name: fullName })
        .where(eq(appUsersTable.id, byEmail[0].id))
        .returning();
      return claimed!;
    }
  }

  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appUsersTable)) as [{ count: number }];
  const isFirst = count === 0;

  const [created] = await db
    .insert(appUsersTable)
    .values({
      auth_user_id: authUser.id,
      email: email || `${authUser.id}@no-email.local`,
      full_name: fullName,
      is_admin: isFirst,
      allowlisted: isFirst,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  // Race: fetch again
  const retry = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.auth_user_id, authUser.id))
    .limit(1);
  return retry[0]!;
}

/** Requires an authenticated + allowlisted user; attaches req.appUser. */
export async function requireAllowlisted(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const appUser = await getOrCreateAppUser(req.user);
    if (!appUser.allowlisted) {
      res.status(403).json({ error: "Access pending" });
      return;
    }
    req.appUser = appUser;
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires an admin (must run after requireAllowlisted). */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.appUser?.is_admin) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}
