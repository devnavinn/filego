import { ComingSoon } from "@/components/coming-soon";

export default function MergePdfPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Merge PDF is coming soon."
        description="We’re building a faster way to combine multiple PDF files, reorder them easily, and export one clean merged document."
        launchDate="2026-08-06T00:00:00"
        backHref="/"
      />
    </main>
  );
}