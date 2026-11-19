import * as React from "react";
import { Text } from "@react-email/components";
import { DetailRow, DetailTable, EmailShell, PrimaryButton } from "@/emails/layout";

export function AppointmentReminderEmail({
  customerName,
  organizationName,
  serviceName,
  date,
  time,
  tokenNumber,
  leadLabel,
  ticketUrl,
}: {
  customerName: string;
  organizationName: string;
  serviceName: string;
  date: string;
  time: string;
  tokenNumber: string;
  leadLabel: string;
  ticketUrl: string;
}) {
  return (
    <EmailShell
      preview={`Reminder: ${serviceName} ${leadLabel} at ${organizationName}`}
      eyebrow={`Appointment reminder · ${leadLabel}`}
      title={`Your visit is coming up, ${customerName.split(" ")[0] || "there"}.`}
    >
      <Text style={{ color: "#A8B2CC", fontSize: 14, lineHeight: 1.65 }}>
        A quick reminder from {organizationName}. Your token stays valid for your own appointment
        window — other bookings do not affect it.
      </Text>
      <DetailTable>
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="Date" value={date} />
        <DetailRow label="Time" value={time} />
        <DetailRow label="Token" value={<span style={{ color: "#67E8F9" }}>{tokenNumber}</span>} />
      </DetailTable>
      <PrimaryButton href={ticketUrl}>Open my QR ticket</PrimaryButton>
    </EmailShell>
  );
}
