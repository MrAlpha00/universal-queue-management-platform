import * as React from "react";
import { Text } from "@react-email/components";
import { Callout, DetailRow, DetailTable, EmailShell, PrimaryButton } from "@/emails/layout";

export function BookingConfirmationEmail({
  customerName,
  organizationName,
  serviceName,
  date,
  time,
  tokenNumber,
  branchName,
  dashboardUrl,
  ticketUrl,
}: {
  customerName: string;
  organizationName: string;
  serviceName: string;
  date: string;
  time: string;
  tokenNumber: string;
  branchName?: string;
  dashboardUrl: string;
  ticketUrl: string;
}) {
  return (
    <EmailShell
      preview={`${organizationName}: your appointment is confirmed · ${tokenNumber}`}
      eyebrow="Booking confirmed"
      title={`You're all set, ${customerName.split(" ")[0] || "there"}.`}
    >
      <Text style={{ color: "#A8B2CC", fontSize: 14, lineHeight: 1.65, margin: "0 0 8px" }}>
        {organizationName} has confirmed your appointment. Your digital token is ready.
      </Text>

      <DetailTable>
        <DetailRow label="Organization" value={organizationName} />
        <DetailRow label="Service" value={serviceName} />
        {branchName && <DetailRow label="Branch" value={branchName} />}
        <DetailRow label="Date" value={date} />
        <DetailRow label="Time" value={time} />
        <DetailRow label="Token number" value={<span style={{ color: "#67E8F9" }}>{tokenNumber}</span>} />
      </DetailTable>

      <Callout>
        <Text style={{ color: "#DDD6FE", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Show your QR ticket when you arrive. Staff will scan it — no printing, no hardware needed.
        </Text>
        <PrimaryButton href={ticketUrl}>View my QR ticket</PrimaryButton>
      </Callout>

      <Text style={{ color: "#6B779A", fontSize: 12, lineHeight: 1.6, margin: "22px 0 0" }}>
        Need to change your plans? Open your dashboard to reschedule or cancel. Please review the
        organization's booking policy before making changes.
      </Text>
      <PrimaryButton href={dashboardUrl}>Open dashboard</PrimaryButton>
    </EmailShell>
  );
}
