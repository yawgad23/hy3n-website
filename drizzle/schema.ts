import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * HY3N Platform Schema
 * Ride-hailing & delivery platform for the Ghanaian market
 */

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ DRIVERS ============
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }),
  vehicleType: mysqlEnum("vehicleType", ["car", "suv", "motorcycle", "van"]).notNull(),
  vehicleMake: varchar("vehicleMake", { length: 100 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  vehicleYear: int("vehicleYear"),
  vehiclePlate: varchar("vehiclePlate", { length: 32 }),
  vehicleColor: varchar("vehicleColor", { length: 32 }),
  rideCategories: json("rideCategories").$type<string[]>().notNull().default([]),
  hasHelmet: boolean("hasHelmet").default(false),
  hasDeliveryBox: boolean("hasDeliveryBox").default(false),
  licenseUrl: varchar("licenseUrl", { length: 512 }),
  insuranceUrl: varchar("insuranceUrl", { length: 512 }),
  roadworthyUrl: varchar("roadworthyUrl", { length: 512 }),
  licenseExpiry: timestamp("licenseExpiry"),
  insuranceExpiry: timestamp("insuranceExpiry"),
  roadworthyExpiry: timestamp("roadworthyExpiry"),
  status: mysqlEnum("status", ["pending_verification", "active", "offline", "suspended"]).default("pending_verification").notNull(),
  isOnline: boolean("isOnline").default(false).notNull(),
  currentLat: decimal("currentLat", { precision: 10, scale: 7 }),
  currentLng: decimal("currentLng", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalTrips: int("totalTrips").default(0),
  dailyCommissionAmount: decimal("dailyCommissionAmount", { precision: 10, scale: 2 }).default("50.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

// ============ TRIPS ============
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  riderId: int("riderId").notNull(),
  driverId: int("driverId"),
  rideCategory: mysqlEnum("rideCategory", ["standard", "comfort", "kantanka", "executive", "okada", "express_delivery"]).notNull(),
  pickupAddress: text("pickupAddress").notNull(),
  pickupLat: decimal("pickupLat", { precision: 10, scale: 7 }),
  pickupLng: decimal("pickupLng", { precision: 10, scale: 7 }),
  dropoffAddress: text("dropoffAddress").notNull(),
  dropoffLat: decimal("dropoffLat", { precision: 10, scale: 7 }),
  dropoffLng: decimal("dropoffLng", { precision: 10, scale: 7 }),
  stops: json("stops").$type<Array<{ address: string; lat?: number; lng?: number; order: number; status?: string }>>().default([]),
  distanceKm: decimal("distanceKm", { precision: 10, scale: 2 }),
  fareEstimate: decimal("fareEstimate", { precision: 10, scale: 2 }).notNull(),
  actualFare: decimal("actualFare", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["pending", "matched", "en_route_pickup", "arrived_pickup", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "momo", "wallet"]).default("cash").notNull(),
  safetyCheckins: json("safetyCheckins").$type<Array<{ at: number; safe: boolean; note?: string }>>().default([]),
  riderName: varchar("riderName", { length: 255 }),
  riderPhone: varchar("riderPhone", { length: 32 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

// ============ COMMISSIONS ============
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull(),
  driverName: varchar("driverName", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  forDate: varchar("forDate", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "unpaid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  paymentReference: varchar("paymentReference", { length: 128 }),
  confirmedByAdminId: int("confirmedByAdminId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// ============ MESSAGES (in-app chat) ============
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  senderRole: mysqlEnum("senderRole", ["driver", "rider"]).notNull(),
  body: text("body").notNull(),
  isQuickReply: boolean("isQuickReply").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============ FEEDBACK ============
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  driverId: int("driverId").notNull(),
  riderUserId: int("riderUserId").notNull(),
  rating: int("rating").notNull(),
  compliments: json("compliments").$type<string[]>().default([]),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// ============ SUPPORT TICKETS ============
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userRole: mysqlEnum("userRole", ["driver", "rider"]).notNull(),
  category: mysqlEnum("category", ["trip_issue", "payment", "account", "safety", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  tripId: int("tripId"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// ============ SAFETY ALERTS (SOS) ============
export const safetyAlerts = mysqlTable("safetyAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userRole: mysqlEnum("userRole", ["driver", "rider"]).notNull(),
  tripId: int("tripId"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  message: text("message"),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = typeof safetyAlerts.$inferInsert;
