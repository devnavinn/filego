import React from "react";
import type { Metadata } from "next";

const SITE_NAME = "Filego";
const SITE_URL = "https://www.filego.in";

export const metadata: Metadata = {
    title: `Cookie Policy | ${SITE_NAME}`,
    description:
        "Read the Filego cookie policy to understand how we use essential, analytics, and preference cookies, how long they last, and how you can manage them.",
    alternates: {
        canonical: `${SITE_URL}/cookies`,
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: `Cookie Policy | ${SITE_NAME}`,
        description:
            "Read the Filego cookie policy to understand how we use essential, analytics, and preference cookies, how long they last, and how you can manage them.",
        url: `${SITE_URL}/cookies`,
        siteName: SITE_NAME,
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Cookie Policy | ${SITE_NAME}`,
        description:
            "Read the Filego cookie policy to understand how we use essential, analytics, and preference cookies, how long they last, and how you can manage them.",
    },
};

const cookieSections = [
    {
        title: "Essential cookies",
        description:
            "These cookies help Filego operate correctly, including core navigation, security-related functions, and basic product behavior required to use the site.",
    },
    {
        title: "Analytics cookies",
        description:
            "These cookies help us understand how visitors use Filego so we can improve performance, usability, and product experience over time.",
    },
    {
        title: "Preference cookies",
        description:
            "These cookies remember choices such as language, display settings, or other site preferences to provide a more consistent experience.",
    },
];

const cookieTable = [
    {
        name: "_session",
        purpose: "Keeps the current session active while you use Filego.",
        expiry: "Session",
        type: "Essential",
    },
    {
        name: "cookie_preferences",
        purpose: "Stores your cookie consent and preference choices.",
        expiry: "6 months",
        type: "Preference",
    },
    {
        name: "_analytics",
        purpose: "Helps measure page visits, feature usage, and product trends.",
        expiry: "13 months",
        type: "Analytics",
    },
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Cookie Policy | ${SITE_NAME}`,
    url: `${SITE_URL}/cookies`,
    description:
        "Cookie policy for Filego explaining essential, analytics, and preference cookies, retention periods, and cookie management choices.",
    isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
    },
};

export default function CookiesPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Cookies
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                    Cookie policy
                </h1>

                <p className="mt-4 text-base text-gray-600 sm:text-lg dark:text-neutral-300">
                    This page explains how Filego uses cookies and similar technologies to run
                    the website, understand usage, remember preferences, and support core product
                    functionality.
                </p>

                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                    You can update your cookie choices at any time through your cookie settings,
                    consent banner options, or browser controls.
                </p>
            </section>

            <section className="mt-12 grid gap-6 md:grid-cols-3" aria-label="Cookie categories">
                {cookieSections.map((section) => (
                    <article
                        key={section.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.title}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                            {section.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mt-14 rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8 transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Cookie details
                </h2>

                <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
                    The examples below show the type of information users should be able to
                    review, including cookie name, category, purpose, and how long the cookie
                    remains active on a device or browser.
                </p>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-neutral-900">
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Cookie
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Purpose
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Expiry
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {cookieTable.map((cookie, index) => (
                                <tr
                                    key={cookie.name}
                                    className={index !== 0 ? "border-t border-gray-200 dark:border-neutral-800" : ""}
                                >
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {cookie.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-300">
                                        {cookie.type}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-300">
                                        {cookie.purpose}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-300">
                                        {cookie.expiry}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8 transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Managing cookies
                </h2>

                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                    You can control non-essential cookies through the cookie banner, preference
                    settings, or your browser configuration. If we introduce new non-essential
                    cookies or materially change how they are used, users should be asked to
                    review and update their choices again.
                </p>
            </section>
        </main>
    );
}