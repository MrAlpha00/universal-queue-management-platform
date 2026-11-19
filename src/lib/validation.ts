import { z } from "zod";

/**
 * Shared request schemas for the public JSON API. Keeping them in one module
 * makes the wire contract testable and prevents route handlers from drifting.
 */

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date");

export const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:MM time");

export const bookingInputSchema = z.object({
  serviceId: z.string().uuid(),
  branchId: z.string().uuid(),
  date: isoDateSchema,
  startTime: clockTimeSchema,
  responses: z.record(z.string(), z.unknown()).default({}),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const bookingCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const organizationCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
  description: z.string().optional(),
  timezone: z.string().min(1).default("UTC"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  branchId: z.string().uuid(),
  date: isoDateSchema,
});

export const scheduleGenerateSchema = z
  .object({
    orgSlug: z.string().min(1),
    serviceId: z.string().uuid(),
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine((value) => value.to >= value.from, {
    message: "The end date must be on or after the start date",
    path: ["to"],
  });

export const tokenVerifySchema = z.object({
  reference: z.string().min(4).max(300),
  orgSlug: z.string().min(1),
  branchId: z.string().uuid().optional().nullable(),
  source: z.enum(["CAMERA", "MANUAL"]).default("CAMERA"),
});
