import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const SITE_URL = "https://www.filego.in";

export const metadata: Metadata = {
  title: "Help Center | Filego",
  description:
    "Answers about using Filego's tools, AI features, accounts, billing, and privacy — plus how to reach support.",
  alternates: {
    canonical: `${SITE_URL}/help`,
  },
};

const quickLinks = [
  {
    title: "Browse tools",
    description: "See every PDF, image, video, and AI tool.",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "Manage your plan",
    description: "Compare Free, Pro, and Lifetime.",
    href: "/dashboard/premium",
    icon: CreditCard,
  },
  {
    title: "System status",
    description: "Check current tool and account status.",
    href: "/status",
    icon: Sparkles,
  },
  {
    title: "Contact support",
    description: "Reach the team directly.",
    href: "/contact",
    icon: LifeBuoy,
  },
];

type FaqItem = { q: string; a: ReactNode };
type FaqGroup = { title: string; icon: typeof Sparkles; items: FaqItem[] };

const faqGroups: FaqGroup[] = [
  {
    title: "Getting started",
    icon: Sparkles,
    items: [
      {
        q: "Do I need an account to use Filego?",
        a: "No — most tools (compression, conversion, merging, and similar tasks) work directly without signing in. An account is only required for AI-powered features and for saving usage history or a paid plan.",
      },
      {
        q: "Is Filego free to use?",
        a: "Yes. The core tools are free with no daily limits. AI-powered tools (OCR, summarization, resume parsing, file chat) have a daily usage limit on the free plan, with higher limits on Pro.",
      },
      {
        q: "A tool says \"coming soon\" — when will it launch?",
        a: "Tools marked \"coming soon\" are actively being built. You can leave your email on that tool's page to get notified as soon as it launches.",
      },
    ],
  },
  {
    title: "Files & privacy",
    icon: ShieldCheck,
    items: [
      {
        q: "Are my files uploaded to a server?",
        a: "It depends on the tool. Many tools process files entirely in your browser, so the file never leaves your device. Others — particularly AI-powered tools — require server-side processing to generate results. See our Privacy Policy for the full details.",
      },
      {
        q: "Do you store my files after processing?",
        a: "Browser-based tools don't send files to our servers at all. For tools that do use server-side processing, files are handled only long enough to produce your result — see the Privacy Policy for retention specifics.",
      },
    ],
  },
  {
    title: "AI tools & limits",
    icon: Bell,
    items: [
      {
        q: "How do daily AI limits work?",
        a: "Free accounts get 5 AI generations per day (OCR, summarization, resume parsing, file chat, etc.), resetting every 24 hours. Pro accounts get 100 per day.",
      },
      {
        q: "Why was my AI request blocked?",
        a: "You've likely hit your daily AI limit, or you're not signed in — AI features require an account. Sign in, or upgrade to Pro for a higher daily limit.",
      },
    ],
  },
  {
    title: "Billing & plans",
    icon: CreditCard,
    items: [
      {
        q: "What do the paid plans include?",
        a: "Pro (₹199/month or ₹499/year) raises your daily AI limit to 100 generations and unlocks higher processing limits across tools. Lifetime (₹1,999 one-time) gives the same benefits with no recurring payment.",
      },
      {
        q: "How do I upgrade, downgrade, or cancel?",
        a: (
          <>
            Upgrades happen from your{" "}
            <Link href="/dashboard/premium" className="underline underline-offset-2">
              account&rsquo;s Premium page
            </Link>
            . To cancel or change a subscription, contact{" "}
            <a href="mailto:hello@filego.in" className="underline underline-offset-2">
              hello@filego.in
            </a>{" "}
            and we&rsquo;ll take care of it.
          </>
        ),
      },
    ],
  },
  {
    title: "Troubleshooting",
    icon: Wrench,
    items: [
      {
        q: "A tool isn't working as expected — what should I do?",
        a: "First, try a different file or refresh the page. If the problem continues, check the Status page for known issues, or contact support with the tool name and what happened so we can look into it.",
      },
      {
        q: "I found a bug or security issue — how do I report it?",
        a: "Please email hello@filego.in with details. Security-related reports are treated as a priority.",
      },
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqGroups.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof item.a === "string" ? item.a : group.title,
      },
    }))
  ),
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.10),transparent_40%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              Help Center
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Answers about tools, accounts, and billing.
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Can&rsquo;t find what you need here? Reach out and we&rsquo;ll help directly.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/contact">
                  Contact support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/tools">Browse tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-start gap-2.5 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-medium tracking-tight transition-colors group-hover:text-primary">
                        {item.title}
                      </h2>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
          <p className="text-xs font-medium text-muted-foreground">Frequently asked questions</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            Browse by topic
          </h2>

          <div className="mt-8 space-y-8">
            {faqGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold tracking-tight">{group.title}</h3>
                  </div>

                  <div className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                    {group.items.map((item) => (
                      <details key={item.q} className="group/faq bg-card px-4 py-3.5 open:pb-4 sm:px-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground marker:content-none">
                          {item.q}
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open/faq:rotate-90" />
                        </summary>
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center md:px-6 md:py-16">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Still stuck?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Send us a message with what you&rsquo;re trying to do and we&rsquo;ll get back to you.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/contact">
                Contact support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
