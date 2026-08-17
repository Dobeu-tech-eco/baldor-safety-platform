import {
  AllowlistEmailBody,
  CommitIngestBody,
  CreateSnowEventBody,
  ListIncidentsQueryParams,
  PreviewIngestBody,
  SetIncidentPreventableBody,
  UpdateUserBody,
  UpsertMileageBody,
  UpsertOverrideBody,
} from "@workspace/api-zod";
import {
  db,
  appUsersTable,
  incidentsTable,
  mileageTable,
  overridesTable,
  snowEventsTable,
  uploadBatchesTable,
  uploadFilesTable,
  datasetMergesTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  getOrCreateAppUser,
  requireAdmin,
  requireAllowlisted,
} from "../lib/appUsers";
import { cleanRows, commitIngest, type ParsedRow } from "../lib/ingest";

const router: IRouter = Router();

// --- Profile (authenticated, but NOT allowlist-gated: used for the pending screen) ---
router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const profile = await getOrCreateAppUser(req.user);
  res.json(profile);
});

// Everything below requires an allowlisted user.
router.use(requireAllowlisted);

// --- User management (admin only) ---
router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select()
    .from(appUsersTable)
    .orderBy(asc(appUsersTable.email));
  res.json(users);
});

router.post("/users", requireAdmin, async (req, res) => {
  const body = AllowlistEmailBody.parse(req.body);
  const email = body.email.toLowerCase().trim();
  const [user] = await db
    .insert(appUsersTable)
    .values({ email, allowlisted: true })
    .onConflictDoUpdate({
      target: appUsersTable.email,
      set: { allowlisted: true },
    })
    .returning();
  res.json(user);
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  const body = UpdateUserBody.parse(req.body);
  const [user] = await db
    .update(appUsersTable)
    .set({
      ...(body.is_admin !== undefined ? { is_admin: body.is_admin } : {}),
      ...(body.allowlisted !== undefined
        ? { allowlisted: body.allowlisted }
        : {}),
    })
    .where(eq(appUsersTable.id, String(req.params["id"])))
    .returning();
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(user);
});

// --- Incidents ---
router.get("/incidents", async (req, res) => {
  const q = ListIncidentsQueryParams.parse(req.query);
  const conds = [];
  if (!q.includeFollowons) conds.push(eq(incidentsTable.is_followon, false));
  if (q.from) conds.push(gte(incidentsTable.loss_date, q.from));
  if (q.to) conds.push(lte(incidentsTable.loss_date, q.to));
  if (q.branch) conds.push(eq(incidentsTable.branch, q.branch));
  if (q.isInjury !== undefined)
    conds.push(eq(incidentsTable.is_injury, q.isInjury));
  let query = db
    .select()
    .from(incidentsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      q.order === "desc"
        ? desc(incidentsTable.loss_date)
        : asc(incidentsTable.loss_date),
    )
    .$dynamic();
  if (q.limit) query = query.limit(q.limit);
  res.json(await query);
});

router.put("/incidents/:occurrenceNumber/preventable", async (req, res) => {
  const occ = String(req.params["occurrenceNumber"]);
  const body = SetIncidentPreventableBody.parse(req.body);
  await db
    .insert(overridesTable)
    .values({
      occurrence_number: occ,
      preventable: body.preventable,
      note: body.note ?? "Manual override",
    })
    .onConflictDoUpdate({
      target: overridesTable.occurrence_number,
      set: {
        preventable: body.preventable,
        note: body.note ?? "Manual override",
      },
    });
  await db
    .update(incidentsTable)
    .set({ preventable: body.preventable, updated_at: new Date() })
    .where(eq(incidentsTable.occurrence_number, occ));
  res.json({ ok: true });
});

// --- Ingestion ---
router.post("/ingest/preview", async (req, res) => {
  const body = PreviewIngestBody.parse(req.body);
  const result = await cleanRows(body.rows as ParsedRow[]);
  res.json({
    rowCount: result.rows.length,
    followOnRemoved: result.followOnRemoved,
    classificationsRestored: result.classificationsRestored,
    classified: result.classified,
    newCount: result.newCount,
    duplicateCount: result.duplicateCount,
    conflictCount: result.conflictCount,
  });
});

router.post("/ingest/commit", async (req, res) => {
  const body = CommitIngestBody.parse(req.body);
  const cleaned = await cleanRows(body.rows as ParsedRow[]);
  const result = await commitIngest(
    cleaned,
    { name: body.filename, size: body.byteSize, hash: body.fileHash },
    req.appUser?.id ?? null,
    body.acceptConflicts ?? true,
  );
  res.json(result);
});

router.get("/upload-files/check", async (req, res) => {
  const hash = String(req.query["hash"] ?? "");
  const rows = await db
    .select()
    .from(uploadFilesTable)
    .where(eq(uploadFilesTable.file_hash, hash))
    .limit(1);
  res.json({ isDuplicate: rows.length > 0, existing: rows[0] ?? null });
});

router.get("/upload-history", async (_req, res) => {
  const [batches, files, merges] = await Promise.all([
    db
      .select()
      .from(uploadBatchesTable)
      .orderBy(desc(uploadBatchesTable.uploaded_at))
      .limit(50),
    db
      .select()
      .from(uploadFilesTable)
      .orderBy(desc(uploadFilesTable.uploaded_at))
      .limit(50),
    db
      .select()
      .from(datasetMergesTable)
      .orderBy(desc(datasetMergesTable.performed_at))
      .limit(50),
  ]);
  res.json({ batches, files, merges });
});

// --- Mileage ---
router.get("/mileage", async (req, res) => {
  const conds = [];
  if (req.query["year"])
    conds.push(eq(mileageTable.year, Number(req.query["year"])));
  if (req.query["month"])
    conds.push(eq(mileageTable.month, Number(req.query["month"])));
  const rows = await db
    .select()
    .from(mileageTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(mileageTable.year), asc(mileageTable.month));
  res.json(rows);
});

router.put("/mileage", async (req, res) => {
  const body = UpsertMileageBody.parse(req.body);
  for (const row of body) {
    await db
      .insert(mileageTable)
      .values(row)
      .onConflictDoUpdate({
        target: [mileageTable.branch, mileageTable.year, mileageTable.month],
        set: { miles: row.miles },
      });
  }
  res.json({ ok: true });
});

// --- Overrides ---
router.get("/overrides", async (_req, res) => {
  res.json(
    await db
      .select()
      .from(overridesTable)
      .orderBy(asc(overridesTable.occurrence_number)),
  );
});

router.post("/overrides", async (req, res) => {
  const body = UpsertOverrideBody.parse(req.body);
  const [row] = await db
    .insert(overridesTable)
    .values({
      occurrence_number: body.occurrence_number,
      preventable: body.preventable,
      note: body.note ?? "",
    })
    .onConflictDoUpdate({
      target: overridesTable.occurrence_number,
      set: { preventable: body.preventable, note: body.note ?? "" },
    })
    .returning();
  res.json(row);
});

router.delete("/overrides/:id", async (req, res) => {
  await db
    .delete(overridesTable)
    .where(eq(overridesTable.id, String(req.params["id"])));
  res.json({ ok: true });
});

// --- Snow events ---
router.get("/snow-events", async (_req, res) => {
  res.json(
    await db
      .select()
      .from(snowEventsTable)
      .orderBy(asc(snowEventsTable.year), asc(snowEventsTable.month)),
  );
});

router.post("/snow-events", async (req, res) => {
  const body = CreateSnowEventBody.parse(req.body);
  const [row] = await db
    .insert(snowEventsTable)
    .values({
      year: body.year,
      month: body.month,
      attributable_count: body.attributable_count,
      note: body.note ?? "",
    })
    .returning();
  res.json(row);
});

router.delete("/snow-events/:id", async (req, res) => {
  await db
    .delete(snowEventsTable)
    .where(eq(snowEventsTable.id, String(req.params["id"])));
  res.json({ ok: true });
});

export default router;
