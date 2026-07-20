"use client";

import { Camera, Keyboard, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FoodSearchResult } from "@/lib/foodDataCentral";
import type { IScannerControls } from "@zxing/browser";

export function BarcodeLookup({ onFound }: { onFound: (food: FoodSearchResult) => void }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  async function lookup(code = barcode) {
    const clean = code.replace(/\D/g, "");
    if (!clean) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/foods/barcode?barcode=${clean}`);
      const data = await response.json() as { food?: FoodSearchResult; error?: string };
      if (!response.ok || !data.food) throw new Error(data.error || "Food not found.");
      setBarcode(clean); onFound(data.food); stopScan();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Food not found."); }
    finally { setLoading(false); }
  }

  function stopScan() { controlsRef.current?.stop(); controlsRef.current = null; setScanning(false); }

  async function startScan() {
    if (!navigator.mediaDevices?.getUserMedia) { setError("This browser cannot access a camera. Enter the barcode below instead."); return; }
    try {
      setScanning(true); setError("");
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!videoRef.current) throw new Error("Camera preview did not initialize.");
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => { if (result?.getText()) void lookup(result.getText()); },
      );
    } catch (cause) { setError(cause instanceof Error && cause.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings or enter the barcode manually." : "The camera could not start. Enter the barcode manually or try another browser."); stopScan(); }
  }

  useEffect(() => () => controlsRef.current?.stop(), []);

  return <div className="mb-4 rounded-md border border-line bg-black/15 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Barcode lookup</p><p className="text-xs text-muted">Scan on mobile or type the number on a computer.</p></div>
      <Button type="button" variant="secondary" onClick={scanning ? stopScan : startScan}>{scanning ? <X size={16}/> : <Camera size={16}/>}<span className="ml-2">{scanning ? "Stop camera" : "Scan barcode"}</span></Button></div>
    {scanning ? <video ref={videoRef} muted playsInline className="mt-3 max-h-64 w-full rounded-md bg-black object-cover" /> : null}
    <div className="mt-3 flex gap-2"><div className="relative flex-1"><Keyboard size={16} className="absolute left-3 top-3.5 text-muted"/><Input className="pl-9" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))} placeholder="UPC / EAN barcode" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void lookup(); } }}/></div>
      <Button type="button" onClick={() => void lookup()} disabled={loading}><ScanBarcode size={16}/><span className="ml-2">{loading ? "Looking up…" : "Find item"}</span></Button></div>
    {error ? <p className="mt-2 text-sm text-ember" role="alert">{error}</p> : null}
  </div>;
}
