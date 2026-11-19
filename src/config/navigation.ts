import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BellRing,
  Building2,
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  QrCode,
  ScanLine,
  Settings2,
  ShieldCheck,
  Store,
  Ticket,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const publicNav: NavItem[] = [
  { label: "Features", href: "/features", icon: LayoutDashboard },
  { label: "How it works", href: "/how-it-works", icon: ClipboardList },
  { label: "Platform", href: "/platform-capabilities", icon: Building2 },
  { label: "About", href: "/about", icon: Users },
  { label: "Contact", href: "/contact", icon: BellRing },
];

export const customerNav: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your appointments at a glance",
  },
  {
    label: "Explore organizations",
    href: "/organizations",
    icon: Store,
    description: "Find a service near you",
  },
  {
    label: "Create organization",
    href: "/onboarding/organization",
    icon: Building2,
    description: "Set up a management workspace",
  },
  {
    label: "My appointments",
    href: "/appointments",
    icon: CalendarCheck2,
    description: "Upcoming and past visits",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UsersRound,
    description: "Personal information",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
    description: "Preferences and security",
  },
];

export function managementNav(orgSlug: string): NavItem[] {
  const base = `/manage/${orgSlug}`;
  return [
    { label: "Overview", href: `${base}/overview`, icon: LayoutDashboard },
    { label: "Appointments", href: `${base}/appointments`, icon: CalendarCheck2 },
    { label: "Queue", href: `${base}/queue`, icon: Activity },
    { label: "QR scanner", href: `${base}/scanner`, icon: ScanLine },
    { label: "Tokens", href: `${base}/tokens`, icon: Ticket },
    { label: "Services", href: `${base}/services`, icon: ClipboardList },
    { label: "Schedules", href: `${base}/schedules`, icon: CalendarCheck2 },
    { label: "Branches", href: `${base}/branches`, icon: Building2 },
    { label: "Customers", href: `${base}/customers`, icon: Users },
    { label: "Staff", href: `${base}/staff`, icon: ShieldCheck },
    { label: "Notifications", href: `${base}/notifications`, icon: BellRing },
    { label: "Analytics", href: `${base}/analytics`, icon: BarChart3 },
    { label: "Audit log", href: `${base}/audit-logs`, icon: ClipboardList },
    { label: "Settings", href: `${base}/settings`, icon: Settings2 },
  ];
}

export const platformNav: NavItem[] = [
  { label: "Overview", href: "/platform/overview", icon: LayoutDashboard },
  { label: "Organizations", href: "/platform/organizations", icon: Building2 },
  { label: "Users", href: "/platform/users", icon: Users },
  { label: "Bookings", href: "/platform/bookings", icon: CalendarCheck2 },
  { label: "Notifications", href: "/platform/notifications", icon: BellRing },
  { label: "Activity", href: "/platform/activity", icon: Activity },
  { label: "Settings", href: "/platform/settings", icon: Settings2 },
];

export const workflowSteps = [
  {
    number: "01",
    title: "Discover",
    detail: "Find an approved organization and the right service.",
    icon: Store,
  },
  {
    number: "02",
    title: "Choose",
    detail: "Pick a branch, date and an available time slot.",
    icon: CalendarCheck2,
  },
  {
    number: "03",
    title: "Book",
    detail: "Answer service-specific questions and confirm instantly.",
    icon: ClipboardList,
  },
  {
    number: "04",
    title: "Token",
    detail: "Receive a secure digital token and QR ticket.",
    icon: QrCode,
  },
  {
    number: "05",
    title: "Remind",
    detail: "Get automated email reminders on your schedule.",
    icon: BellRing,
  },
  {
    number: "06",
    title: "Scan",
    detail: "Staff verify the QR and check you in — hardware free.",
    icon: ScanLine,
  },
];
