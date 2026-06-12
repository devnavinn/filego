import React from "react";
import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-900">
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_45%)]" />
            </div>

            <section className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-16 md:px-6">
                <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                            Error 404
                        </p>

                        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl md:text-7xl">
                            This page wandered off.
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
                            The page you were trying to open may have moved, expired, or never
                            existed in the first place. Let’s get you back to something useful.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
                            >
                                Back to home
                            </Link>

                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
                            >
                                Contact support
                            </Link>
                        </div>

                        <div className="mt-10 flex flex-wrap gap-3 text-sm text-stone-500">
                            <Link
                                href="/"
                                className="rounded-full border border-stone-200 bg-white px-4 py-2 transition hover:border-stone-300 hover:bg-stone-100"
                            >
                                Go to home page
                            </Link>
                            <Link
                                href="/security"
                                className="rounded-full border border-stone-200 bg-white px-4 py-2 transition hover:border-stone-300 hover:bg-stone-100"
                            >
                                Security
                            </Link>
                            <Link
                                href="/contact"
                                className="rounded-full border border-stone-200 bg-white px-4 py-2 transition hover:border-stone-300 hover:bg-stone-100"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="mx-auto max-w-md rounded-[2rem] border border-stone-200/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(20,20,20,0.08)] backdrop-blur">
                            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-stone-500">
                                        Lost page
                                    </span>
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                        Not found
                                    </span>
                                </div>

                                <div className="mt-8 flex items-end gap-3">
                                    <span className="text-7xl font-semibold tracking-tight text-stone-900">
                                        404
                                    </span>
                                    <div className="mb-2 h-px flex-1 bg-stone-200" />
                                </div>

                                <div className="mt-8 space-y-3">
                                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                                        The link may be outdated.
                                    </div>
                                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                                        The page may have been renamed.
                                    </div>
                                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                                        A typo in the URL can also cause this.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -right-2 top-8 hidden rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500 shadow-lg md:block">
                            Try the home page first
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}