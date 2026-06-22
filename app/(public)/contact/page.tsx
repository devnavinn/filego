// app/contact/page.tsx
import type { Metadata } from "next";
import React from "react";
import { ContactForm } from "@/components/forms/contact-form";

const SITE_NAME = "Filego";
const SITE_URL = "https://www.filego.in";

export const metadata: Metadata = {
    title: `Contact ${SITE_NAME} | Support, Security & General Inquiries`,
    description:
        "Contact Filego for product questions, account support, billing help, partnerships, or security-related inquiries. Typical response time is 1–2 business days.",
    alternates: {
        canonical: `${SITE_URL}/contact`,
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: `Contact ${SITE_NAME}`,
        description:
            "Reach the Filego team for support, partnerships, billing, workflow questions, and security inquiries.",
        url: `${SITE_URL}/contact`,
        siteName: SITE_NAME,
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Contact ${SITE_NAME}`,
        description:
            "Get in touch with Filego for support, billing, product questions, partnerships, and security matters.",
    },
};

const contactOptions = [
    {
        title: "General inquiries",
        value: "hello@filego.in",
        description:
            "For product questions, partnerships, or anything not covered below.",
    },
    {
        title: "Support",
        value: "hello@filego.in",
        description:
            "For account, billing, or tool-related issues that need help from the team.",
    },
    {
        title: "Security",
        value: "hello@filego.in",
        description:
            "For responsible disclosure, trust, or security-related questions.",
    },
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: `${SITE_URL}/contact`,
    description:
        "Contact Filego for support, partnerships, security inquiries, account help, and billing questions.",
    mainEntity: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        email: "hello@filego.in",
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "hello@filego.in",
                availableLanguage: ["English"],
            },
            {
                "@type": "ContactPoint",
                contactType: "sales",
                email: "hello@filego.in",
                availableLanguage: ["English"],
            },
            {
                "@type": "ContactPoint",
                contactType: "security",
                email: "hello@filego.in",
                availableLanguage: ["English"],
            },
        ],
    },
};

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Contact Filego
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                    Contact Filego support, sales, or security
                </h1>

                <p className="mt-4 text-base text-gray-600 sm:text-lg dark:text-neutral-300">
                    Get help with your account, billing, workflow questions, partnerships,
                    or security-related concerns.
                </p>

                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                    Typical response time: within 1–2 business days.
                </p>
            </section>

            <section
                className="mt-12 grid gap-6 md:grid-cols-3"
                aria-label="Contact options"
            >
                {contactOptions.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.title}
                        </h2>

                        <a
                            href={`mailto:${item.value}`}
                            className="mt-3 block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            {item.value}
                        </a>

                        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                            {item.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8 transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Send a message
                </h2>

                <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
                    Share a few details and we’ll direct your message to the right team.
                </p>

                <div className="mt-6">
                    <ContactForm />
                </div>
            </section>
        </main>
    );
}