"use client";

import * as React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/domain";

function qrDataUrl(reference: string) {
  return QRCode.toDataURL(reference, {
    width: 392,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0B1022", light: "#FFFFFF" },
  });
}

export function QrTicket({
  appointment,
  reference,
  initialDataUrl,
}: {
  appointment: Appointment;
  reference: string;
  initialDataUrl: string;
}) {
  const [current, setCurrent] = React.useState(reference);
  const [dataUrl, setDataUrl] = React.useState(initialDataUrl);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function reissue() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tokens/${appointment.id}/reissue`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Unable to refresh QR code");
      const next = json.data.qr_reference as string;
      setCurrent(next);
      setDataUrl(await qrDataUrl(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh QR code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl bg-white p-4 shadow-[0_20px_70px_-20px_rgba(139,92,246,0.5)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="QR code for check-in" width={196} height={196} className="h-[196px] w-[196px]" />
      </div>
      <p className="mt-5 max-w-[220px] break-all text-center font-mono text-[10px] text-subtle">{current}</p>
      <div className="mt-5 flex flex-col items-center gap-3">
        <Button variant="secondary" size="sm" loading={busy} onClick={reissue}>
          <RefreshCw className="size-3.5" /> Refresh QR code
        </Button>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <p className="flex items-center gap-1.5 text-[11px] text-subtle">
          <ShieldCheck className="size-3.5 text-teal-300" /> Single-use rotating credential
        </p>
      </div>
    </div>
  );
}
