import type {
  AppointmentStatus,
  FieldType,
  MembershipRole,
  OrganizationStatus,
} from "@/config/constants";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  platform_role: "USER" | "PLATFORM_ADMIN";
  created_at: string;
  updated_at: string;
};

export type OrgSettings = {
  booking_horizon_days?: number;
  token_prefix?: string;
  checkin_early_minutes?: number;
  checkin_grace_minutes?: number;
  reminder_offsets_minutes?: number[];
  enabled_email_types?: string[];
  timezone?: string;
  [key: string]: unknown;
};

export type Organization = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  status: OrganizationStatus;
  approval_note: string | null;
  settings: OrgSettings;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: MembershipRole;
  branch_id: string | null;
  membership_status: string;
  created_at: string;
  profile?: Profile;
};

export type Branch = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  org_id: string;
  branch_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  capacity: number;
  booking_horizon_days: number | null;
  allow_cancellation: boolean;
  cancellation_hours: number;
  color: string;
  is_active: boolean;
  created_at: string;
  service_fields?: ServiceField[];
};

export type ServiceField = {
  id: string;
  org_id: string;
  service_id: string;
  name: string;
  label: string;
  field_type: FieldType;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  options: string[] | { label: string; value: string }[];
  validation: { min?: number; max?: number; pattern?: string; message?: string };
  display_order: number;
  is_active: boolean;
};

export type WorkingHour = {
  id: string;
  org_id: string;
  branch_id: string | null;
  service_id: string | null;
  weekday: number;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
};

export type ScheduleException = {
  id: string;
  org_id: string;
  branch_id: string | null;
  service_id: string | null;
  exception_date: string;
  exception_type: "CLOSED" | "HOLIDAY" | "SPECIAL";
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
};

export type AvailabilitySlot = {
  id: string;
  org_id: string;
  branch_id: string;
  service_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: "OPEN" | "CLOSED";
};

export type Appointment = {
  id: string;
  org_id: string;
  branch_id: string;
  service_id: string;
  customer_id: string;
  slot_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  timezone: string;
  status: AppointmentStatus;
  responses: Record<string, unknown>;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  token?: Token;
  service?: Service;
  branch?: Branch;
  organization?: Organization;
  customer?: Profile;
};

export type Token = {
  id: string;
  org_id: string;
  appointment_id: string;
  service_id: string;
  appointment_date: string;
  token_number: string;
  status: AppointmentStatus;
  issued_at: string;
  updated_at: string;
};

export type CheckInEvent = {
  id: string;
  org_id: string;
  appointment_id: string;
  token_id: string | null;
  scanned_by: string | null;
  scan_source: string;
  result: string;
  created_at: string;
};

export type ReminderEvent = {
  id: string;
  org_id: string;
  appointment_id: string;
  offset_minutes: number;
  scheduled_for: string;
  idempotency_key: string;
  status: "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED" | "SKIPPED";
  task_id: string | null;
  attempts: number;
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

export type NotificationEvent = {
  id: string;
  org_id: string | null;
  appointment_id: string | null;
  user_id: string | null;
  event_type: string;
  recipient: string;
  subject: string | null;
  status: string;
  provider_id: string | null;
  error: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  org_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
};

export type BookingResult = {
  appointment_id: string;
  token_id: string;
  token_number: string;
  qr_reference: string;
  org_id: string;
  org_slug: string;
  org_name: string;
  branch_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  timezone: string;
};

export type VerificationResult =
  | {
      ok: true;
      duplicate: boolean;
      code: string;
      message: string;
      appointment: {
        id: string;
        token_number: string;
        customer_name: string | null;
        customer_email?: string | null;
        service: string;
        date: string;
        start_time: string;
        end_time: string;
        timezone?: string;
        status: AppointmentStatus;
        checked_in_at?: unknown;
      };
    }
  | { ok: false; code: string; message: string };
