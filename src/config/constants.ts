export const APPOINTMENT_STATUSES = [
  "BOOKED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "EXPIRED",
  "NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const TOKEN_STATUSES = APPOINTMENT_STATUSES;

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "BOOKED",
  "CHECKED_IN",
  "IN_PROGRESS",
];

export const TERMINAL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "EXPIRED",
  "NO_SHOW",
];

export const ORGANIZATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "SUSPENDED",
  "REJECTED",
] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBERSHIP_ROLES = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "STAFF",
] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const PLATFORM_ROLES = ["PLATFORM_ADMIN", "USER"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const FIELD_TYPES = [
  "TEXT",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "TEXTAREA",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "DATE",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const DEFAULT_BOOKING_HORIZON_DAYS = 3;
export const DEFAULT_CHECKIN_EARLY_MINUTES = 0;
export const DEFAULT_CHECKIN_GRACE_MINUTES = 0;
export const DEFAULT_SLOT_DURATION_MINUTES = 15;
export const DEFAULT_SLOT_CAPACITY = 1;
export const DEFAULT_TOKEN_PREFIX = "TK";

export const DEFAULT_REMINDER_OFFSETS_MINUTES = [120, 90, 60, 30, 10];

export const PAGE_SIZE = 10;

export const STATUS_STYLES: Record<
  AppointmentStatus | OrganizationStatus,
  { label: string; tone: string; dot: string }
> = {
  BOOKED: {
    label: "Booked",
    tone: "bg-violet-500/12 text-violet-200 border-violet-400/25",
    dot: "bg-violet-400",
  },
  CHECKED_IN: {
    label: "Checked in",
    tone: "bg-cyan-500/12 text-cyan-200 border-cyan-400/25",
    dot: "bg-cyan-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/25",
    dot: "bg-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/25",
    dot: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/25",
    dot: "bg-rose-400",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/25",
    dot: "bg-indigo-400",
  },
  EXPIRED: {
    label: "Expired",
    tone: "bg-slate-500/12 text-slate-300 border-slate-400/20",
    dot: "bg-slate-400",
  },
  NO_SHOW: {
    label: "No show",
    tone: "bg-orange-500/12 text-orange-200 border-orange-400/25",
    dot: "bg-orange-400",
  },
  PENDING: {
    label: "Pending review",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/25",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "Approved",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/25",
    dot: "bg-emerald-400",
  },
  SUSPENDED: {
    label: "Suspended",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/25",
    dot: "bg-rose-400",
  },
  REJECTED: {
    label: "Rejected",
    tone: "bg-slate-500/12 text-slate-300 border-slate-400/20",
    dot: "bg-slate-400",
  },
};
