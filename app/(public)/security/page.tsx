import React from "react";

const securityItems = [
    {
        title: "Encryption",
        description:
            "We protect data in transit and at rest using modern encryption practices.",
    },
    {
        title: "Access controls",
        description:
            "Internal access is limited by role and reviewed to reduce unnecessary exposure.",
    },
    {
        title: "Monitoring",
        description:
            "We monitor systems and activity to help detect reliability and security issues early.",
    },
    {
        title: "Privacy",
        description:
            "We aim to handle user data with clear policies, limited retention, and practical safeguards.",
    },
];

export default function SecurityPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
            <section className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-emerald-600">Security</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    Security and trust
                </h1>
                <p className="mt-4 text-base text-gray-600 sm:text-lg">
                    We’re committed to protecting documents, accounts, and the systems that
                    support them. This page outlines the principles we use to approach
                    security, privacy, and operational reliability.
                </p>
            </section>

            <section className="mt-12 grid gap-6 md:grid-cols-2">
                {securityItems.map((item) => (
                    <div
                        key={item.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                            {item.description}
                        </p>
                    </div>
                ))}
            </section>

            <section className="mt-12 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Security practices
                    </h2>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                        <li>• Role-based access for internal systems.</li>
                        <li>• Ongoing monitoring for suspicious activity and service issues.</li>
                        <li>• Secure development practices and regular review processes.</li>
                        <li>• Controlled handling of uploaded files and stored data.</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Documentation requests
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                        If your team needs more detail for a vendor review, procurement process,
                        or security questionnaire, contact us to request additional information.
                    </p>
                    <button className="mt-6 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
                        Contact security team
                    </button>
                </div>
            </section>
        </main>
    );
}