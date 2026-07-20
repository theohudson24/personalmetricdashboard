import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return <div className="grid min-h-[65vh] place-items-center p-5"><Card className="max-w-xl text-center"><p className="text-sm font-semibold uppercase tracking-widest text-core">404</p><h1 className="mt-2 text-2xl font-semibold">That page could not be found</h1><p className="mt-3 text-muted">The address may be incorrect, or the feature may have moved.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-md border border-core bg-core px-4 text-sm font-medium text-[#07100d]">Return to dashboard</Link></Card></div>;
}
