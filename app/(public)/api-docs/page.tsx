import { ComingSoon } from "@/components/coming-soon";

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ComingSoon
        title="API documentation is coming soon."
        description="We’re preparing developer docs for the Filego API, including authentication, endpoints, request examples, and integration guides for file workflows."
        launchDate="2026-08-10T00:00:00"
        backHref="/"
      />
    </main>
  );
}