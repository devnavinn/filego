import { ComingSoon } from "@/components/coming-soon";

export default function BlogPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
            <ComingSoon
                title="The Filego blog is coming soon."
                description="We’re building a content hub for file workflows, productivity tips, PDF guides, image optimization, and practical tutorials for everyday work."
                launchDate="2026-08-05T00:00:00"
                backHref="/"
            />
        </main>
    );
}