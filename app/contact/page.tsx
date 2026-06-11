// app/contact/page.tsx
import React from "react";
import { ContactForm } from "@/components/forms/contact-form";

const contactOptions = [
    {
        title: "General inquiries",
        value: "hello@filego.in",
        description: "For product questions, partnerships, or anything not covered below.",
    },
    {
        title: "Support",
        value: "hello@filego.in",
        description: "For account, billing, or tool-related issues that need help from the team.",
    },
    {
        title: "Security",
        value: "hello@filego.in",
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
                        <p className="mt-3 text-sm font-medium text-emerald-700">{item.value}</p>
                        <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
                    </div>
                ))}
            </section>

            <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-900">Send a message</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Share a few details and we’ll get your message to the right team.
                </p>

                <div className="mt-6">
                    <ContactForm />
                </div>
            </section>
        </main>
    );
}