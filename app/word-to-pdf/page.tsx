import { ComingSoon } from "@/components/coming-soon";

export default function WordToPdfPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Word to PDF is coming soon."
        description="We’re building a simple way to convert Word documents into polished PDF files while keeping layout, formatting, and structure as consistent as possible."
        launchDate="2026-08-10T00:00:00"
        backHref="/"
      />
    </main>
  );
}