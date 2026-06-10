import { ComingSoon } from "@/components/coming-soon";

export default function PdfToJpgPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="PDF to JPG is coming soon."
        description="We’re building a fast way to convert PDF pages into high-quality JPG images with clean output, simple downloads, and better control over image quality."
        launchDate="2026-08-09T00:00:00"
        backHref="/"
      />
    </main>
  );
}