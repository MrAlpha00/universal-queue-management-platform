import * as React from "react";
import { Text } from "@react-email/components";
import { DetailRow, DetailTable, EmailShell, PrimaryButton } from "@/emails/layout";

export function AppointmentStatusEmail({
  customerName,
  organizationName,
  serviceName,
  date,
  time,
  tokenNumber,
  event,
  note,
  actionUrl,
  actionLabel,
}: {
  customerName: string;
  organizationName: string;
  serviceName: string;
  date: string;
  time: string;
  tokenNumber: string;
  event: "cancelled" | "rescheduled" | "expired" | "update";
  note?: string;
  actionUrl: string;
  actionLabel: string;
}) {
  const content = {
    cancelled: {
      eyebrow: "Appointment cancelled",
      title: "Your appointment has been cancelled",
      body: "The slot has been released and any future reminders have been stopped. You can book a new time whenever you're ready.",
    },
    rescheduled: {
      eyebrow: "Appointment rescheduled",
      title: "Your appointment has a new time",
      body: "Your previous QR code is no longer valid. Open your dashboard to view the new token and QR ticket.",
    },
    expired: {
      eyebrow: "Appointment expired",
      title: "Your appointment window has closed",
      body: "Check-in was not recorded during the appointment window. Please contact the organization or book a new slot.",
    },
    update: {
      eyebrow: "Appointment update",
      title: "There's an update on your appointment",
      body: "The organization updated the status of your appointment.",
    },
  }[event];

  return (
    <EmailShell preview={`${organizationName}: ${content.title}`} eyebrow={content.eyebrow} title={content.title}>
      <Text style={{ color: "#A8B2CC", fontSize: 14, lineHeight: 1.65 }}>
        Hi {customerName.split(" ")[0] || "there"}, {content.body}
      </Text>
      <DetailTable>
        <DetailRow label="Organization" value={organizationName} />
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="Date" value={date} />
        <DetailRow label="Time" value={time} />
        <DetailRow label="Token" value={tokenNumber} />
      </DetailTable>
      {note && (
        <Text style={{ color: "#FBBF24", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" }}>
          Note: {note}
        </Text>
      )}
      <PrimaryButton href={actionUrl}>{actionLabel}</PrimaryButton>
    </EmailShell>
  );
}
