import React from "react";

const contactOptions = [
    {
        title: "General inquiries",
        value: "hello@filego.in",
        description: "For product questions, partnerships, or anything not covered below.",
    },
    {
        title: "Support",
        value: "support@filego.in",
        description: "For account, billing, or tool-related issues that need help from the team.",
    },
    {
        title: "Security",
        value: "security@filego.in",
        description: "For responsible disclosure, trust, or security-related questions.",
    },
];

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
            <section className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-medium text-emerald-600">Contact</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    Get in touch
                </h1>
                <p className="mt-4 text-base text-gray-600 sm:text-lg">
                    Have a question, need support, or want to talk about your workflow?
                    Send us a message and we’ll help direct it to the right place.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Typical response time: within 1–2 business days.
                </p>
            </section>

            <section className="mt-12 grid gap-6 md:grid-cols-3">
                {contactOptions.map((item) => (
                    <div
                        key={item.title}
                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                        <p className="mt-3 text-sm font-medium text-emerald-700">
                            {item.value}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                            {item.description}
                        </p>
                    </div>
                ))}
            </section>

            <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900">Send a message</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Share a few details and we’ll get your message to the right team.
                </p>

                <form className="mt-6 space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-600"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-600"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-900">
                            Topic
                        </label>
                        <select
                            id="topic"
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-600"
                        >
                            <option>General inquiry</option>
                            <option>Support</option>
                            <option>Billing</option>
                            <option>Security</option>
                            <option>Partnership</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-900">
                            Message
                        </label>
                        <textarea
                            id="message"
                            rows={6}
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-600"
                            placeholder="How can we help?"
                        />
                    </div>

                    <button className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
                        Send message
                    </button>
                </form>
            </section>
        </main>
    );
}