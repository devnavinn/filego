import { ComingSoon } from "@/components/coming-soon";

export default function JpgToPdf() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="JPG to PDF is coming soon."
        description="We’re building a simple image-to-PDF tool with support for multiple JPG files, page ordering, clean layout, and fast export in one PDF."
        launchDate="2026-08-08T00:00:00"
        backHref="/"
      />
    </main>
  );
}