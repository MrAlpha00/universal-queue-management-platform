import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { brand } from "@/config/brand";

export function EmailShell({
  preview,
  title,
  eyebrow,
  children,
}: {
  preview: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>◆ {brand.name}</Text>
            <Text style={headerTagline}>{brand.tagline}</Text>
          </Section>
          <Section style={cardStyle}>
            {eyebrow && <Text style={eyebrowStyle}>{eyebrow}</Text>}
            <Heading style={headingStyle}>{title}</Heading>
            {children}
          </Section>
          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerText}>
              Sent by {brand.name} on behalf of the organization you booked with.
            </Text>
            <Text style={footerText}>
              <Link href="{{resend.unsubscribe}}" style={footerLink}>
                Manage notifications
              </Link>
              {" · "}
              <Link href={`https://${brand.domain}/about`} style={footerLink}>
                About {brand.name}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={detailLabel}>{label}</td>
      <td style={detailValue}>{value}</td>
    </tr>
  );
}

export function DetailTable({ children }: { children: React.ReactNode }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
      <tbody>{children}</tbody>
    </table>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={buttonStyle}>
      {children}
    </a>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <Section style={calloutStyle}>{children}</Section>;
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#080B18",
  margin: 0,
  padding: "32px 12px",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const containerStyle: React.CSSProperties = { maxWidth: 580, margin: "0 auto" };

const headerStyle: React.CSSProperties = { padding: "0 8px 20px" };

const brandStyle: React.CSSProperties = {
  color: "#A78BFA",
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  margin: 0,
};

const headerTagline: React.CSSProperties = {
  color: "#6B779A",
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  margin: "4px 0 0",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#121A30",
  border: "1px solid #263052",
  borderRadius: 18,
  padding: "32px 30px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#22D3EE",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  margin: "0 0 10px",
};

const headingStyle: React.CSSProperties = {
  color: "#F4F6FF",
  fontSize: 26,
  lineHeight: 1.2,
  fontWeight: 700,
  margin: "0 0 16px",
};

const detailLabel: React.CSSProperties = {
  color: "#8B96B3",
  fontSize: 13,
  padding: "9px 0",
  width: "40%",
  verticalAlign: "top",
};

const detailValue: React.CSSProperties = {
  color: "#F4F6FF",
  fontSize: 13,
  fontWeight: 600,
  padding: "9px 0",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#8B5CF6",
  color: "#FFFFFF",
  textDecoration: "none",
  borderRadius: 10,
  padding: "12px 22px",
  fontSize: 14,
  fontWeight: 700,
  margin: "14px 0 0",
};

const calloutStyle: React.CSSProperties = {
  backgroundColor: "rgba(139,92,246,0.10)",
  border: "1px solid rgba(139,92,246,0.28)",
  borderRadius: 12,
  padding: "16px 18px",
  margin: "20px 0 0",
};

const dividerStyle: React.CSSProperties = { borderColor: "#24304D", margin: "24px 0 18px" };

const footerStyle: React.CSSProperties = { padding: "0 8px" };

const footerText: React.CSSProperties = {
  color: "#66728F",
  fontSize: 11,
  lineHeight: 1.6,
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = { color: "#A78BFA", textDecoration: "none" };
