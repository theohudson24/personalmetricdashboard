"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return <div role="status" className="mb-5 flex items-start gap-3 rounded-md border border-pulse/40 bg-pulse/10 p-3 text-sm text-muted"><WifiOff size={18} className="mt-0.5 shrink-0 text-pulse"/><span>You are offline. Existing information may remain visible, but new changes cannot be saved until the connection returns.</span></div>;
}
