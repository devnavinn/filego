import React from "react";

const cookieSections = [
    {
        title: "Essential cookies",
        description:
            "These cookies help the website function properly, including basic navigation, security, and core product behavior.",
    },
    {
        title: "Analytics cookies",
        description:
            "These cookies help us understand how visitors use the site so we can improve performance and usability.",
    },
    {
        title: "Preference cookies",
        description:
            "These cookies remember choices such as language, display settings, or other site preferences.",
    },
];

const cookieTable = [
    {
        name: "_session",
        purpose: "Keeps the current session active while you use the site.",
        expiry: "Session",
    },
    {
        name: "cookie_preferences",
        purpose: "Stores your cookie consent choices.",
        expiry: "6 months",
    },
    {
        name: "_analytics",
        purpose: "Helps measure page visits and product usage trends.",
        expiry: "13 months",
    },
];

export default function CookiesPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
            <section className="mx-auto max-w-3xl">
                <p className="text-sm font-medium text-emerald-600">Cookies</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    Cookie policy
                </h1>
                <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
                    This page explains how we use cookies and similar technologies to run the
                    website, understand usage, and remember your preferences.
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-500">
                    You can update your cookie choices at any time through your cookie
                    settings or browser controls.
                </p>
            </section>

            <section className="mt-12 grid gap-6 md:grid-cols-3">
                {cookieSections.map((section) => (
                    <div
                        key={section.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                            {section.description}
                        </p>
                    </div>
                ))}
            </section>

            <section className="mt-14 rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900">Cookie details</h2>
                <p className="mt-2 text-sm text-gray-600">
                    The examples below show the kind of information users should be able to
                    review: cookie name, purpose, and how long it stays on the device.
                </p>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Cookie</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Purpose</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cookieTable.map((cookie) => (
                                <tr key={cookie.name} className="border-t border-gray-200">
                                    <td className="px-4 py-3 text-sm text-gray-900">{cookie.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{cookie.purpose}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{cookie.expiry}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mx-auto mt-14 max-w-3xl">
                <h2 className="text-2xl font-semibold text-gray-900">Managing cookies</h2>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                    You can control non-essential cookies through the cookie banner, settings
                    interface, or your browser preferences. If we introduce new non-essential
                    cookies or change how they are used, users should be asked to review their
                    choices again.
                </p>
            </section>
        </main>
    );
}