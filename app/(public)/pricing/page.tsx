import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";

import { PlanCards } from "@/components/pricing/plan-cards";
import { authOptions } from "@/lib/auth-provider";
import { getUserPlan } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Pricing | Filego",
  description:
    "Filego is free to use. Upgrade to Filego Pro for bigger files, unlimited batches, more AI generations and no ads, from ₹199 a month.",
  alternates: { canonical: "/pricing" },
};

const faqs = [
  {
    q: "Does Pro renew automatically?",
    a: "No. Pro is a prepaid pass. You pay once for a month or a year, and it simply ends when the time is up. Buy another pass whenever you like.",
  },
  {
    q: "What happens if I buy a pass while Pro is still active?",
    a: "The new pass starts when your current one ends, so you never lose days.",
  },
  {
    q: "Which payment methods can I use?",
    a: "UPI, cards, net banking and wallets, all through Razorpay.",
  },
  {
    q: "Are my files uploaded?",
    a: "Most tools run entirely in your browser on every plan. AI tools send the file to our AI provider to process it and don't store it.",
  },
];

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const plan = await getUserPlan(session?.user?.id);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Simple pricing. No subscriptions.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Every tool is free to use. Pro removes ads and raises your limits, with a one-time
            payment for a month or a year.
          </p>
        </div>

        <div className="mt-12">
          <PlanCards tier={plan.tier} expiresAt={plan.expiresAt} isLifetime={plan.isLifetime} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight">Questions</h2>
        <dl className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-5">
              <dt className="text-sm font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
