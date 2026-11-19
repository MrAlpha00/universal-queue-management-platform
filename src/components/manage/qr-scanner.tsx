"use client";

import * as React from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  Loader2,
  ScanLine,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, SelectNative } from "@/components/ui/input";
import type { VerificationResult } from "@/types/domain";

type Controls = { stop: () => void };

export function QrScanner({
  orgSlug,
  branches,
}: {
  orgSlug: string;
  branches: Array<{ id: string; name: string }>;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<Controls | null>(null);
  const lastRef = React.useRef<{ value: string; at: number } | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [cameraError, setCameraError] = React.useState("");
  const [manual, setManual] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [error, setError] = React.useState("");

  const verify = React.useCallback(
    async (reference: string, source: "CAMERA" | "MANUAL") => {
      const value = reference.trim();
      if (!value) return;
      setVerifying(true);
      setError("");
      try {
        const res = await fetch("/api/tokens/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reference: value, orgSlug, branchId: branchId || null, source }),
        });
        const json = await res.json();
        if (!res.ok && !json?.data) throw new Error(json?.error?.message ?? "Unable to verify token");
        setResult(json.data as VerificationResult);
        setManual("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to verify token");
      } finally {
        setVerifying(false);
      }
    },
    [branchId, orgSlug],
  );

  const stop = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }, []);

  async function start() {
    setStarting(true);
    setCameraError("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 350 });
      const video = videoRef.current;
      if (!video) throw new Error("Camera is not available");
      const controls = await reader.decodeFromVideoDevice(undefined, video, (scanResult) => {
        if (!scanResult) return;
        const text = scanResult.getText();
        const now = Date.now();
        if (lastRef.current && lastRef.current.value === text && now - lastRef.current.at < 4000) return;
        lastRef.current = { value: text, at: now };
        void verify(text, "CAMERA");
      });
      controlsRef.current = controls;
      setScanning(true);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message.includes("Permission")
            ? "Camera permission was denied. Allow camera access or use manual entry."
            : err.message
          : "Unable to start the camera",
      );
    } finally {
      setStarting(false);
    }
  }

  React.useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2">
            <ScanLine className="size-4 text-cyan-300" />
            <h2 className="text-sm font-bold">Camera scanner</h2>
          </div>
          {scanning ? (
            <Badge tone="teal"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live</Badge>
          ) : (
            <Badge tone="neutral">Idle</Badge>
          )}
        </div>

        <div className="p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050711]">
            <video ref={videoRef} className="size-full object-cover" muted playsInline />
            {!scanning && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-subtle">
                    <Camera className="size-6" />
                  </div>
                  <p className="mt-4 text-xs text-subtle">Start the camera to scan a customer QR ticket.</p>
                </div>
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-cyan-400/60 shadow-[0_0_0_9999px_rgba(5,7,17,0.45)]" />
                <div className="absolute left-1/2 top-1/2 h-0.5 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-cyan-400" />
              </div>
            )}
          </div>

          {cameraError && <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-200">{cameraError}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {scanning ? (
              <Button variant="destructive" onClick={stop}><CameraOff className="size-4" /> Stop camera</Button>
            ) : (
              <Button variant="cyan" loading={starting} onClick={start}><Camera className="size-4" /> Start camera</Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="scanner-branch" className="text-[11px] text-subtle">Branch</label>
              <SelectNative id="scanner-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-9 w-44 text-xs">
                <option value="">Any branch</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </SelectNative>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Keyboard className="size-4 text-violet-300" /> Manual entry</h2>
          <p className="mt-1 text-xs text-muted">Paste or type the QR reference printed under the code.</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void verify(manual, "MANUAL");
            }}
          >
            <Field label="QR reference" htmlFor="manual-reference">
              <Input id="manual-reference" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="tfq_…" autoComplete="off" />
            </Field>
            <Button type="submit" className="w-full" variant="secondary" loading={verifying} disabled={!manual.trim() || verifying}>
              Verify token
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold">Result</h2>
          {error && <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
          {!result && !error && (
            <p className="mt-3 text-xs text-subtle">Scan or enter a reference to see the verification result.</p>
          )}
          {verifying && (
            <p className="mt-4 flex items-center gap-2 text-xs text-subtle"><Loader2 className="size-4 animate-spin" /> Verifying…</p>
          )}
          {result && !verifying && result.ok && (
            <div className="mt-4 space-y-3">
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${result.duplicate ? "border-amber-400/25 bg-amber-500/10 text-amber-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>
                {result.duplicate ? <ShieldAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
                <span className="text-xs font-semibold">{result.message}</span>
              </div>
              <dl className="space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-subtle">Token</dt><dd className="font-mono font-bold text-violet-200">{result.appointment.token_number}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-subtle">Customer</dt><dd className="font-semibold">{result.appointment.customer_name ?? "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-subtle">Service</dt><dd className="font-semibold">{result.appointment.service}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-subtle">Date</dt><dd className="font-semibold">{result.appointment.date}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-subtle">Time</dt><dd className="font-semibold">{result.appointment.start_time?.slice(0, 5)} – {result.appointment.end_time?.slice(0, 5)}</dd></div>
              </dl>
              <Button variant="secondary" className="w-full" onClick={() => setResult(null)}>Scan next</Button>
            </div>
          )}
          {result && !verifying && !result.ok && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-rose-200">
                <XCircle className="size-4" />
                <span className="text-xs font-semibold">{result.message}</span>
              </div>
              <Badge tone="coral">{result.code.replaceAll("_", " ")}</Badge>
              <Button variant="secondary" className="w-full" onClick={() => setResult(null)}>Try again</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
