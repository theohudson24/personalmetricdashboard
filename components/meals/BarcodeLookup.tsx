"use client";

import { Camera, Keyboard, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FoodSearchResult } from "@/lib/foodDataCentral";

type Detector = { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = new (options?: { formats?: string[] }) => Detector;

export function BarcodeLookup({ onFound }: { onFound: (food: FoodSearchResult) => void }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  function stopScan() { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setScanning(false); }

  async function startScan() {
    const DetectorClass = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!DetectorClass) { setError("Camera barcode scanning is not supported in this browser. Enter the barcode below instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream; setScanning(true); setError("");
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } });
      const detector = new DetectorClass({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      const scan = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) { await lookup(codes[0].rawValue); return; } } catch {}
        if (streamRef.current) requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch { setError("Camera access was denied or unavailable. You can enter the barcode manually."); stopScan(); }
  }

  useEffect(() => stopScan, []);

  return <div className="mb-4 rounded-md border border-line bg-black/15 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Barcode lookup</p><p className="text-xs text-muted">Scan on mobile or type the number on a computer.</p></div>
      <Button type="button" variant="secondary" onClick={scanning ? stopScan : startScan}>{scanning ? <X size={16}/> : <Camera size={16}/>}<span className="ml-2">{scanning ? "Stop camera" : "Scan barcode"}</span></Button></div>
    {scanning ? <video ref={videoRef} muted playsInline className="mt-3 max-h-64 w-full rounded-md bg-black object-cover" /> : null}
    <div className="mt-3 flex gap-2"><div className="relative flex-1"><Keyboard size={16} className="absolute left-3 top-3.5 text-muted"/><Input className="pl-9" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))} placeholder="UPC / EAN barcode" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void lookup(); } }}/></div>
      <Button type="button" onClick={() => void lookup()} disabled={loading}><ScanBarcode size={16}/><span className="ml-2">{loading ? "Looking up…" : "Find item"}</span></Button></div>
    {error ? <p className="mt-2 text-sm text-ember" role="alert">{error}</p> : null}
  </div>;
}
