import { ComingSoon } from "@/components/coming-soon";

export default function RotatePdfPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Rotate PDF is coming soon."
        description="We’re building a simple way to rotate PDF pages, fix page orientation, and prepare documents for cleaner viewing, sharing, and export."
        launchDate="2026-08-12T00:00:00"
        backHref="/"
      />
    </main>
  );
}