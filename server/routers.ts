import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import {
  RIDE_CATEGORIES,
  estimateFare,
  getDailyCommissionForVehicle,
  type RideCategoryId,
} from "../shared/hy3n";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const rideCategoryEnum = z.enum([
  "standard",
  "comfort",
  "kantanka",
  "executive",
  "okada",
  "express_delivery",
]);

const vehicleTypeEnum = z.enum(["car", "suv", "motorcycle", "van"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CATALOG (public) ============
  catalog: router({
    categories: publicProcedure.query(() => RIDE_CATEGORIES),
    estimate: publicProcedure
      .input(z.object({ category: rideCategoryEnum, distanceKm: z.number().min(0), durationMin: z.number().min(0).default(0) }))
      .query(({ input }) => ({ fare: estimateFare(input.category, input.distanceKm, input.durationMin) })),
  }),

  // ============ DRIVERS ============
  drivers: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return (await db.getDriverByUserId(ctx.user.id)) ?? null;
    }),

    register: protectedProcedure
      .input(z.object({
        fullName: z.string().min(2),
        phone: z.string().min(7),
        email: z.string().email().optional(),
        vehicleType: vehicleTypeEnum,
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().int().optional(),
        vehiclePlate: z.string().optional(),
        vehicleColor: z.string().optional(),
        rideCategories: z.array(rideCategoryEnum).min(1),
        hasHelmet: z.boolean().optional(),
        hasDeliveryBox: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getDriverByUserId(ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Driver profile already exists" });
        const dailyCommissionAmount = String(getDailyCommissionForVehicle(input.vehicleType));
        const id = await db.createDriver({
          userId: ctx.user.id,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? null,
          vehicleType: input.vehicleType,
          vehicleMake: input.vehicleMake ?? null,
          vehicleModel: input.vehicleModel ?? null,
          vehicleYear: input.vehicleYear ?? null,
          vehiclePlate: input.vehiclePlate ?? null,
          vehicleColor: input.vehicleColor ?? null,
          rideCategories: input.rideCategories,
          hasHelmet: input.hasHelmet ?? false,
          hasDeliveryBox: input.hasDeliveryBox ?? false,
          dailyCommissionAmount,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        rideCategories: z.array(rideCategoryEnum).optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleColor: z.string().optional(),
        hasHelmet: z.boolean().optional(),
        hasDeliveryBox: z.boolean().optional(),
        licenseUrl: z.string().optional(),
        insuranceUrl: z.string().optional(),
        roadworthyUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const me = await db.getDriverByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateDriver(me.id, input as any);
        return { success: true };
      }),

    setOnline: protectedProcedure
      .input(z.object({ online: z.boolean(), lat: z.number().optional(), lng: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const me = await db.getDriverByUserId(ctx.user.id);
        if (!me) throw new TRPCError({ code: "NOT_FOUND", message: "Register as a driver first" });
        const patch: any = { isOnline: input.online, status: input.online ? "active" : "offline" };
        if (input.lat !== undefined) patch.currentLat = String(input.lat);
        if (input.lng !== undefined) patch.currentLng = String(input.lng);
        await db.updateDriver(me.id, patch);
        return { success: true };
      }),

    isBlocked: protectedProcedure.query(async ({ ctx }) => {
      const me = await db.getDriverByUserId(ctx.user.id);
      if (!me) return { blocked: false, openCount: 0 };
      const open = await db.getDriverOpenCommissions(me.id);
      return { blocked: open.length > 0, openCount: open.length, openRecords: open };
    }),

    listOnline: publicProcedure.query(async () => {
      const list = await db.listDrivers({ online: true });
      // Return safe public-facing slice
      return list.map((d) => ({
        id: d.id,
        fullName: d.fullName,
        vehicleType: d.vehicleType,
        rideCategories: d.rideCategories,
        rating: d.rating,
        currentLat: d.currentLat,
        currentLng: d.currentLng,
      }));
    }),

    // Admin
    listAll: adminProcedure.query(async () => db.listDrivers()),
  }),

  // ============ TRIPS ============
  trips: router({
    create: protectedProcedure
      .input(z.object({
        rideCategory: rideCategoryEnum,
        pickupAddress: z.string().min(2),
        pickupLat: z.number().optional(),
        pickupLng: z.number().optional(),
        dropoffAddress: z.string().min(2),
        dropoffLat: z.number().optional(),
        dropoffLng: z.number().optional(),
        stops: z.array(z.object({ address: z.string(), lat: z.number().optional(), lng: z.number().optional(), order: z.number() })).default([]),
        distanceKm: z.number().min(0).default(0),
        durationMin: z.number().min(0).default(0),
        paymentMethod: z.enum(["cash", "momo", "wallet"]).default("cash"),
        riderName: z.string().optional(),
        riderPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fare = estimateFare(input.rideCategory, input.distanceKm, input.durationMin);
        const id = await db.createTrip({
          riderId: ctx.user.id,
          rideCategory: input.rideCategory,
          pickupAddress: input.pickupAddress,
          pickupLat: input.pickupLat !== undefined ? String(input.pickupLat) : null,
          pickupLng: input.pickupLng !== undefined ? String(input.pickupLng) : null,
          dropoffAddress: input.dropoffAddress,
          dropoffLat: input.dropoffLat !== undefined ? String(input.dropoffLat) : null,
          dropoffLng: input.dropoffLng !== undefined ? String(input.dropoffLng) : null,
          stops: input.stops,
          distanceKm: String(input.distanceKm),
          fareEstimate: String(fare),
          paymentMethod: input.paymentMethod,
          riderName: input.riderName ?? ctx.user.name ?? null,
          riderPhone: input.riderPhone ?? null,
          notes: input.notes ?? null,
        });
        return { id, fare };
      }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const t = await db.getTripById(input.id);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      return t;
    }),

    listMine: protectedProcedure.query(async ({ ctx }) => db.listTripsForRider(ctx.user.id)),

    listPending: protectedProcedure.query(async () => db.listPendingTrips()),

    listForDriver: protectedProcedure.query(async ({ ctx }) => {
      const driver = await db.getDriverByUserId(ctx.user.id);
      if (!driver) return [];
      return db.listTripsForDriver(driver.id);
    }),

    accept: protectedProcedure.input(z.object({ tripId: z.number() })).mutation(async ({ ctx, input }) => {
      const driver = await db.getDriverByUserId(ctx.user.id);
      if (!driver) throw new TRPCError({ code: "NOT_FOUND", message: "Register as a driver first" });

      // Block if unpaid
      const open = await db.getDriverOpenCommissions(driver.id);
      if (open.length > 0) throw new TRPCError({ code: "FORBIDDEN", message: "Pay daily commission to accept trips" });

      const trip = await db.getTripById(input.tripId);
      if (!trip) throw new TRPCError({ code: "NOT_FOUND" });
      if (trip.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Trip already taken" });

      // Verify category compatibility
      const cats = (driver.rideCategories as string[]) ?? [];
      if (!cats.includes(trip.rideCategory)) throw new TRPCError({ code: "FORBIDDEN", message: "Vehicle not certified for this category" });

      await db.updateTrip(input.tripId, { driverId: driver.id, status: "matched" });
      return { success: true };
    }),

    setStatus: protectedProcedure
      .input(z.object({ tripId: z.number(), status: z.enum(["en_route_pickup", "arrived_pickup", "in_progress", "completed", "cancelled"]) }))
      .mutation(async ({ input }) => {
        const patch: any = { status: input.status };
        if (input.status === "completed") patch.completedAt = new Date();
        await db.updateTrip(input.tripId, patch);
        return { success: true };
      }),

    safetyCheckin: protectedProcedure
      .input(z.object({ tripId: z.number(), safe: z.boolean(), note: z.string().optional() }))
      .mutation(async ({ input }) => {
        const t = await db.getTripById(input.tripId);
        if (!t) throw new TRPCError({ code: "NOT_FOUND" });
        const checkins = (t.safetyCheckins as any[]) ?? [];
        checkins.push({ at: Date.now(), safe: input.safe, note: input.note });
        await db.updateTrip(input.tripId, { safetyCheckins: checkins });
        return { success: true };
      }),

    listActive: adminProcedure.query(async () => db.listActiveTrips()),
  }),

  // ============ COMMISSIONS ============
  commissions: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const driver = await db.getDriverByUserId(ctx.user.id);
      if (!driver) return [];
      return db.getDriverOpenCommissions(driver.id);
    }),

    listAll: adminProcedure.query(async () => db.listAllCommissions(200)),

    generateToday: adminProcedure.mutation(async () => {
      const allDrivers = await db.listDrivers({ status: "active" });
      const today = new Date().toISOString().slice(0, 10);
      let created = 0;
      for (const d of allDrivers) {
        const open = await db.getDriverOpenCommissions(d.id);
        if (open.some((r) => r.forDate === today)) continue;
        const amount = Number(d.dailyCommissionAmount ?? getDailyCommissionForVehicle(d.vehicleType));
        await db.createCommission({
          driverId: d.id,
          driverName: d.fullName,
          amount: String(amount),
          forDate: today,
          status: "pending",
        });
        created++;
      }
      return { created };
    }),

    markPaid: adminProcedure
      .input(z.object({ id: z.number(), reference: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.markCommissionPaid(input.id, ctx.user.id, input.reference);
        return { success: true };
      }),
  }),

  // ============ MESSAGES (chat) ============
  messages: router({
    list: protectedProcedure.input(z.object({ tripId: z.number() })).query(async ({ input }) => db.listMessagesForTrip(input.tripId)),
    send: protectedProcedure
      .input(z.object({ tripId: z.number(), body: z.string().min(1).max(500), isQuickReply: z.boolean().optional(), senderRole: z.enum(["driver", "rider"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          tripId: input.tripId,
          senderUserId: ctx.user.id,
          senderRole: input.senderRole,
          body: input.body,
          isQuickReply: input.isQuickReply ?? false,
        });
        return { success: true };
      }),
  }),

  // ============ FEEDBACK ============
  feedback: router({
    submit: protectedProcedure
      .input(z.object({ tripId: z.number(), driverId: z.number(), rating: z.number().min(1).max(5), compliments: z.array(z.string()).default([]), comment: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.createFeedback({
          tripId: input.tripId,
          driverId: input.driverId,
          riderUserId: ctx.user.id,
          rating: input.rating,
          compliments: input.compliments,
          comment: input.comment ?? null,
        });
        return { success: true };
      }),
    forDriver: protectedProcedure.query(async ({ ctx }) => {
      const driver = await db.getDriverByUserId(ctx.user.id);
      if (!driver) return [];
      return db.listFeedbackForDriver(driver.id);
    }),
  }),

  // ============ SUPPORT ============
  support: router({
    submit: protectedProcedure
      .input(z.object({
        userRole: z.enum(["driver", "rider"]),
        category: z.enum(["trip_issue", "payment", "account", "safety", "other"]),
        subject: z.string().min(2),
        description: z.string().min(2),
        tripId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTicket({
          userId: ctx.user.id,
          userRole: input.userRole,
          category: input.category,
          subject: input.subject,
          description: input.description,
          tripId: input.tripId ?? null,
        });
        return { success: true };
      }),
    mine: protectedProcedure.query(async ({ ctx }) => db.listTickets({ userId: ctx.user.id })),
    listAll: adminProcedure.query(async () => db.listTickets()),
  }),

  // ============ SAFETY ============
  safety: router({
    sos: protectedProcedure
      .input(z.object({ userRole: z.enum(["driver", "rider"]), tripId: z.number().optional(), lat: z.number().optional(), lng: z.number().optional(), message: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.createSafetyAlert({
          userId: ctx.user.id,
          userRole: input.userRole,
          tripId: input.tripId ?? null,
          lat: input.lat !== undefined ? String(input.lat) : null,
          lng: input.lng !== undefined ? String(input.lng) : null,
          message: input.message ?? null,
        });
        return { success: true };
      }),
    listActive: adminProcedure.query(async () => db.listActiveSafetyAlerts()),
    resolve: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.resolveSafetyAlert(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
