/**
 * Central brand configuration. Rename TokenFlow here and the change propagates
 * across the application, emails and metadata.
 */
export const brand = {
  name: "TokenFlow",
  legalName: "TokenFlow Platform",
  tagline: "Appointments, beautifully orchestrated.",
  shortDescription:
    "The universal token and appointment platform for modern organizations.",
  description:
    "TokenFlow is a multi-organization appointment and digital token platform. Create services, publish availability, book appointments, issue secure QR tokens and run operations from one polished workspace.",
  domain: "tokenflow.app",
  supportEmail: "support@tokenflow.app",
  version: "1.0.0",
} as const;

export const brandPalette = {
  background: "#080B18",
  surface: "#10172A",
  surfaceRaised: "#171F38",
  text: "#F4F6FF",
  textMuted: "#A8B2CC",
  violet: "#8B5CF6",
  cyan: "#22D3EE",
  teal: "#34D399",
  coral: "#FB7185",
  amber: "#FBBF24",
} as const;
