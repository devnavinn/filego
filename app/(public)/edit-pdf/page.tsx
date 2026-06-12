import { ComingSoon } from "@/components/coming-soon";

export default function EditPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="Edit PDF is coming soon."
        description="We’re building a cleaner PDF editing experience with text annotations, highlights, shapes, image insertion, and simple page-level adjustments."
        launchDate="2026-08-12T00:00:00"
        backHref="/"
      />
    </main>
  );
}