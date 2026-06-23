import React from "react";
import type { Metadata } from "next";

const SITE_NAME = "Filego";
const SITE_URL = "https://www.filego.in";

export const metadata: Metadata = {
    title: `Security and Trust | ${SITE_NAME}`,
    description:
        "Learn how Filego approaches document security, privacy, access control, and operational reliability for PDF, image, and file workflows.",
    alternates: {
        canonical: `${SITE_URL}/security`,
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: `Security and Trust | ${SITE_NAME}`,
        description:
            "Learn how Filego approaches document security, privacy, access control, and operational reliability for PDF, image, and file workflows.",
        url: `${SITE_URL}/security`,
        siteName: SITE_NAME,
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Security and Trust | ${SITE_NAME}`,
        description:
            "Learn how Filego approaches document security, privacy, access control, and operational reliability for PDF, image, and file workflows.",
    },
};

const securityItems = [
    {
        title: "Encryption",
        description:
            "Filego is designed to protect documents and file data in transit and at rest using modern security practices where applicable.",
    },
    {
        title: "Access controls",
        description:
            "Access to internal systems and operational data is limited by role to reduce unnecessary exposure.",
    },
    {
        title: "Monitoring",
        description:
            "We monitor application reliability and system activity to help identify suspicious behavior and service issues early.",
    },
    {
        title: "Privacy",
        description:
            "We aim to handle uploaded files and account data with clear policies, limited retention, and practical safeguards.",
    },
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Security and Trust | ${SITE_NAME}`,
    url: `${SITE_URL}/security`,
    description:
        "Security and trust information for Filego covering privacy, document handling, access controls, and operational reliability.",
    isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
    },
};

export default function SecurityPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Security
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                    Security and trust for file workflows
                </h1>

                <p className="mt-4 text-base text-gray-600 sm:text-lg dark:text-neutral-300">
                    Filego is built to make PDF, image, and document workflows faster and easier
                    to use. This page explains how we approach document security, privacy, access
                    control, and operational reliability across the platform.
                </p>
            </section>

            <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="Security highlights">
                {securityItems.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.title}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                            {item.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mt-14 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8 transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Security practices
                    </h2>

                    <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                        <li>• Role-based access for internal systems and operational tools.</li>
                        <li>• Monitoring for suspicious activity, service issues, and reliability concerns.</li>
                        <li>• Secure development and review practices for product changes.</li>
                        <li>• Controlled handling of uploaded files and stored data.</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8 transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Vendor review and security requests
                    </h2>

                    <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                        If your team needs more detail for procurement, vendor onboarding, or a
                        security questionnaire, contact us at hello@filego.in and we’ll route your
                        request to the right team.
                    </p>

                    <a
                        href="mailto:hello@filego.in?subject=Security%20Request%20-%20Filego"
                        className="mt-6 inline-flex rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        Contact security team
                    </a>
                </div>
            </section>
        </main>
    );
}