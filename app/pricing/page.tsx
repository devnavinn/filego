import React from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For trying the core PDF tools.",
    features: ["Basic conversions", "Limited daily usage", "Standard processing"],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For individuals who use PDF tools regularly.",
    features: ["Unlimited conversions", "Priority processing", "Advanced PDF tools"],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "For teams that need higher limits and shared workflows.",
    features: ["Everything in Pro", "Team access", "Higher usage limits"],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-emerald-600">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Simple pricing for PDF tools
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          Choose a plan based on how often you work with PDFs. Start free, upgrade
          when you need higher limits, and keep billing easy to understand.
        </p>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 shadow-sm ${plan.highlighted
                ? "border-emerald-600 bg-emerald-50"
                : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
              {plan.highlighted ? (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-gray-600">{plan.description}</p>

            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              {plan.period ? (
                <span className="pb-1 text-sm text-gray-500">{plan.period}</span>
              ) : null}
            </div>

            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>

            <button
              className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-medium transition ${plan.highlighted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-xl font-semibold text-gray-900">FAQs</h2>
        <div className="mt-6 space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900">Can I start for free?</h3>
            <p className="mt-1">
              Yes, the Free plan is meant for basic usage and lets users try the
              core workflow before upgrading.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Can I upgrade later?</h3>
            <p className="mt-1">
              Yes, users can begin with a smaller plan and move to a higher tier
              when they need more volume or features.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}