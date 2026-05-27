import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  drivers, InsertDriver,
  trips, InsertTrip,
  commissions, InsertCommission,
  messages, InsertMessage,
  feedback, InsertFeedback,
  supportTickets, InsertSupportTicket,
  safetyAlerts, InsertSafetyAlert,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// =============== USERS ===============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  (["name", "email", "loginMethod"] as const).forEach((field) => {
    const v = user[field];
    if (v === undefined) return;
    const normalized = v ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

// =============== DRIVERS ===============
export async function createDriver(input: InsertDriver) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(drivers).values(input);
  const id = (result as unknown as { insertId: number }).insertId ?? 0;
  return id;
}

export async function getDriverByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
  return r[0];
}

export async function getDriverById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
  return r[0];
}

export async function updateDriver(id: number, patch: Partial<InsertDriver>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(drivers).set(patch).where(eq(drivers.id, id));
}

export async function listDrivers(opts: { online?: boolean; status?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (opts.online !== undefined) conds.push(eq(drivers.isOnline, opts.online));
  if (opts.status) conds.push(eq(drivers.status, opts.status as any));
  const query = conds.length > 0
    ? db.select().from(drivers).where(and(...conds)).orderBy(desc(drivers.createdAt))
    : db.select().from(drivers).orderBy(desc(drivers.createdAt));
  return await query;
}

// =============== TRIPS ===============
export async function createTrip(input: InsertTrip) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(trips).values(input);
  const id = (result as unknown as { insertId: number }).insertId ?? 0;
  return id;
}

export async function getTripById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  return r[0];
}

export async function updateTrip(id: number, patch: Partial<InsertTrip>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(trips).set(patch).where(eq(trips.id, id));
}

export async function listPendingTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.status, "pending")).orderBy(desc(trips.createdAt));
}

export async function listTripsForDriver(driverId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.driverId, driverId)).orderBy(desc(trips.createdAt)).limit(limit);
}

export async function listTripsForRider(riderId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.riderId, riderId)).orderBy(desc(trips.createdAt)).limit(limit);
}

export async function listActiveTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(inArray(trips.status, ["matched", "en_route_pickup", "arrived_pickup", "in_progress"])).orderBy(desc(trips.createdAt));
}

// =============== COMMISSIONS ===============
export async function createCommission(input: InsertCommission) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(commissions).values(input);
}

export async function getDriverOpenCommissions(driverId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).where(and(eq(commissions.driverId, driverId), inArray(commissions.status, ["pending", "overdue", "unpaid"])));
}

export async function listAllCommissions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).orderBy(desc(commissions.createdAt)).limit(limit);
}

export async function markCommissionPaid(id: number, adminId: number, reference?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(commissions).set({ status: "paid", paidAt: new Date(), confirmedByAdminId: adminId, paymentReference: reference ?? null }).where(eq(commissions.id, id));
}

// =============== MESSAGES ===============
export async function createMessage(input: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(messages).values(input);
}

export async function listMessagesForTrip(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.tripId, tripId)).orderBy(messages.createdAt);
}

// =============== FEEDBACK ===============
export async function createFeedback(input: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(feedback).values(input);
}

export async function listFeedbackForDriver(driverId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedback).where(eq(feedback.driverId, driverId)).orderBy(desc(feedback.createdAt)).limit(limit);
}

// =============== SUPPORT TICKETS ===============
export async function createTicket(input: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(supportTickets).values(input);
}

export async function listTickets(opts: { userId?: number; status?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (opts.userId) conds.push(eq(supportTickets.userId, opts.userId));
  if (opts.status) conds.push(eq(supportTickets.status, opts.status as any));
  const query = conds.length > 0
    ? db.select().from(supportTickets).where(and(...conds)).orderBy(desc(supportTickets.createdAt))
    : db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  return await query;
}

// =============== SAFETY ALERTS ===============
export async function createSafetyAlert(input: InsertSafetyAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(safetyAlerts).values(input);
}

export async function listActiveSafetyAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(safetyAlerts).where(eq(safetyAlerts.status, "active")).orderBy(desc(safetyAlerts.createdAt));
}

export async function resolveSafetyAlert(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(safetyAlerts).set({ status: "resolved" }).where(eq(safetyAlerts.id, id));
}
