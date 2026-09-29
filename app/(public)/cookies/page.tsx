import React from "react";
import type { Metadata } from "next";

const SITE_NAME = "Filego";
const SITE_URL = "https://www.filego.in";

export const metadata: Metadata = {
    title: `Cookie Policy | ${SITE_NAME}`,
    description:
        "Read the Filego cookie policy to understand how we use essential, analytics, advertising, and consent cookies, how long they last, and how you can manage them.",
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
            "Read the Filego cookie policy to understand how we use essential, analytics, advertising, and consent cookies, how long they last, and how you can manage them.",
        url: `${SITE_URL}/cookies`,
        siteName: SITE_NAME,
        type: "website",
    },
    twitter: {
        card: "summary",
        title: `Cookie Policy | ${SITE_NAME}`,
        description:
            "Read the Filego cookie policy to understand how we use essential, analytics, advertising, and consent cookies, how long they last, and how you can manage them.",
    },
};

const cookieSections = [
    {
        title: "Essential cookies",
        description:
            "These keep you signed in, protect forms against cross-site request forgery, and let payments complete. Filego cannot work properly without them.",
    },
    {
        title: "Analytics cookies",
        description:
            "Google Analytics uses these to tell us which pages and tools people use, so we can improve performance and fix problems.",
    },
    {
        title: "Advertising cookies",
        description:
            "Google AdSense uses these to show ads to visitors on the Free plan, limit how often you see the same ad, and measure ad performance. Pro users see no ads.",
    },
    {
        title: "Consent cookies",
        description:
            "These remember the choices you make in the cookie consent message, so we don't ask you again on every visit.",
    },
];

const cookieTable = [
    {
        name: "next-auth.session-token",
        purpose: "Keeps you signed in to your Filego account. Named __Secure-next-auth.session-token on HTTPS.",
        expiry: "30 days",
        type: "Essential",
    },
    {
        name: "next-auth.csrf-token",
        purpose: "Protects sign-in and account forms against cross-site request forgery.",
        expiry: "Session",
        type: "Essential",
    },
    {
        name: "next-auth.callback-url",
        purpose: "Remembers which page to return you to after you sign in.",
        expiry: "Session",
        type: "Essential",
    },
    {
        name: "_ga, _ga_<ID>",
        purpose: "Google Analytics: distinguishes visitors and sessions to measure site usage.",
        expiry: "Up to 2 years",
        type: "Analytics",
    },
    {
        name: "__gads, __gpi",
        purpose: "Google AdSense: serves ads, limits how often an ad repeats, and measures ad performance.",
        expiry: "Up to 13 months",
        type: "Advertising",
    },
    {
        name: "__eoi",
        purpose: "Google AdSense: helps detect ad fraud and invalid clicks.",
        expiry: "Up to 6 months",
        type: "Advertising",
    },
    {
        name: "FCCDCF, FCNEC",
        purpose: "Google's consent message: stores your cookie and ad personalization choices.",
        expiry: "Up to 13 months",
        type: "Consent",
    },
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Cookie Policy | ${SITE_NAME}`,
    url: `${SITE_URL}/cookies`,
    description:
        "Cookie policy for Filego explaining essential, analytics, advertising, and consent cookies, retention periods, and cookie management choices.",
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

            <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Cookie categories">
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
                    These are the main cookies set on filego.in. Google may change the names and
                    lifetimes of its cookies over time, and may also set cookies on its own domains
                    (such as doubleclick.net) when ads are shown. Razorpay sets its own cookies on
                    its checkout window when you pay. Your theme choice is kept in your
                    browser&apos;s local storage, not in a cookie.
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

                <div className="mt-4 space-y-4 text-sm leading-6 text-gray-600 dark:text-neutral-300">
                    <p>
                        If you visit from the European Economic Area, the UK, or Switzerland, Google&apos;s
                        consent message asks for your permission before advertising cookies are used for
                        personalized ads. You can change your choice at any time from the privacy and
                        cookie settings link that the message provides.
                    </p>
                    <p>
                        Wherever you are, you can turn off personalized ads from Google at{" "}
                        <a
                            href="https://myadcenter.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            My Ad Center
                        </a>
                        , and read how Google uses information from sites that use its services at{" "}
                        <a
                            href="https://policies.google.com/technologies/partner-sites"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            policies.google.com
                        </a>
                        .
                    </p>
                    <p>
                        You can also block or delete cookies in your browser settings. Blocking essential
                        cookies will stop sign-in from working. Filego Pro removes ads entirely, so no
                        advertising cookies are set by ads on our pages while you are signed in to Pro.
                    </p>
                </div>
            </section>
        </main>
    );
}