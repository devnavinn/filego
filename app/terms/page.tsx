import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service | Filego",
    description:
        "Read the Terms of Service for using Filego, including account rules, acceptable use, billing, and service limitations.",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-background">
            <section className="border-b">
                <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
                    <p className="text-sm font-medium text-muted-foreground">Legal</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                        Terms of Service
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                        These Terms of Service govern your access to and use of Filego,
                        including our website, file tools, APIs, and related services.
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Effective date: June 10, 2026
                    </p>
                </div>
            </section>

            <section>
                <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
                    <div className="space-y-10 text-sm leading-7 text-foreground/90 md:text-base">
                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Acceptance of terms
                            </h2>
                            <p>
                                By accessing or using Filego, you agree to be bound by these Terms
                                of Service and our{" "}
                                <Link href="/privacy" className="underline underline-offset-4">
                                    Privacy Policy
                                </Link>
                                . If you do not agree, do not use the service.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Eligibility
                            </h2>
                            <p>
                                You must be legally capable of entering into a binding agreement
                                to use Filego. If you use Filego on behalf of a company or other
                                entity, you represent that you have authority to bind that entity
                                to these terms.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Our services
                            </h2>
                            <p>
                                Filego provides tools for file processing, conversion, organization,
                                compression, editing, and related workflows. Features may change,
                                improve, be discontinued, or vary by plan, region, browser, device,
                                or file type.
                            </p>
                            <p>
                                Some tools may process files locally in the browser, while others
                                may require temporary server-side processing. Service behavior may
                                vary depending on technical requirements and supported functionality.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Accounts
                            </h2>
                            <p>
                                Some parts of Filego may require an account. You are responsible for
                                maintaining the confidentiality of your account credentials and for
                                all activities that occur under your account.
                            </p>
                            <p>
                                You must provide accurate information and promptly update it if it changes.
                                We may suspend or terminate accounts that are inaccurate, insecure,
                                abusive, or in violation of these terms.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Acceptable use
                            </h2>
                            <p>You agree not to use Filego to:</p>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>Violate any law, regulation, or third-party right.</li>
                                <li>Upload, process, or distribute malicious code or harmful files.</li>
                                <li>Attempt to reverse engineer, probe, disrupt, or overload the service.</li>
                                <li>Bypass usage limits, rate limits, access controls, or plan restrictions.</li>
                                <li>Process content you do not have the right to use.</li>
                                <li>Use the service to infringe intellectual property, privacy, or confidentiality rights.</li>
                                <li>Access the service through automated means in a way that harms performance or availability, except as allowed by our APIs or written permission.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Files and user content
                            </h2>
                            <p>
                                You retain ownership of files, documents, images, and other content
                                you submit to Filego. You grant us only the limited rights necessary
                                to operate, maintain, secure, and improve the service and to complete
                                the actions you request.
                            </p>
                            <p>
                                You are solely responsible for the legality, accuracy, quality, and
                                rights associated with your files and content. We are not responsible
                                for reviewing all user content and may remove or restrict content if
                                required by law, policy, or security needs.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Paid plans, billing, and renewals
                            </h2>
                            <p>
                                Some features may require a paid subscription or one-time purchase.
                                Pricing, usage limits, billing intervals, and included features will
                                be shown at the time of purchase or on the pricing page.
                            </p>
                            <p>
                                If you purchase a subscription, you authorize recurring billing until
                                cancellation, where applicable. Fees are generally non-refundable except
                                where required by law or expressly stated otherwise.
                            </p>
                            <p>
                                We may change pricing or plan structure prospectively. If required, we
                                will provide notice before changes take effect for your next billing cycle.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Intellectual property
                            </h2>
                            <p>
                                Filego and its related software, branding, design, interfaces, text,
                                graphics, logos, and service content are owned by us or our licensors
                                and are protected by applicable intellectual property laws.
                            </p>
                            <p>
                                Subject to these terms, we grant you a limited, non-exclusive,
                                non-transferable, revocable right to use the service for its intended purpose.
                                No ownership rights are transferred to you.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Third-party services
                            </h2>
                            <p>
                                Filego may integrate with or rely on third-party providers such as hosting,
                                analytics, payment processors, storage vendors, OCR providers, or external APIs.
                                We are not responsible for third-party services, sites, or terms beyond our control.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Availability and changes
                            </h2>
                            <p>
                                We may modify, suspend, or discontinue any part of Filego at any time,
                                with or without notice. We do not guarantee uninterrupted availability,
                                error-free operation, or compatibility with every device, browser, or file format.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Disclaimers
                            </h2>
                            <p>
                                Filego is provided on an “as is” and “as available” basis to the maximum extent
                                permitted by law. We disclaim all warranties, whether express, implied, statutory,
                                or otherwise, including implied warranties of merchantability, fitness for a particular
                                purpose, title, non-infringement, and uninterrupted or error-free service.
                            </p>
                            <p>
                                We do not guarantee that files will always be processed successfully, preserved without
                                corruption, or produce results suitable for every business, legal, or professional use case.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Limitation of liability
                            </h2>
                            <p>
                                To the maximum extent permitted by law, Filego and its affiliates, officers, employees,
                                contractors, licensors, and partners will not be liable for any indirect, incidental,
                                special, consequential, exemplary, or punitive damages, or for any loss of profits,
                                revenues, goodwill, data, files, or business opportunities arising out of or related to
                                your use of the service.
                            </p>
                            <p>
                                To the maximum extent permitted by law, our total liability for any claim relating to
                                the service will not exceed the amount you paid to us for the relevant service in the
                                12 months before the event giving rise to the claim, or a minimal statutory amount if
                                required by applicable law.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Indemnification
                            </h2>
                            <p>
                                You agree to defend, indemnify, and hold harmless Filego and its affiliates from and
                                against claims, liabilities, damages, judgments, losses, costs, and expenses, including
                                reasonable legal fees, arising from your use of the service, your files or content, your
                                violation of these terms, or your violation of any law or third-party right.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Suspension and termination
                            </h2>
                            <p>
                                We may suspend or terminate your access to all or part of Filego at our discretion if
                                we believe you violated these terms, pose a security risk, misuse the service, or create
                                legal exposure for us or others.
                            </p>
                            <p>
                                You may stop using the service at any time. Provisions that by their nature should survive
                                termination, including ownership, disclaimers, limitations of liability, indemnity, and
                                dispute terms, will survive.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Governing law and disputes
                            </h2>
                            <p>
                                These terms are governed by the laws specified by Filego in its applicable legal notice,
                                without regard to conflict of law principles, unless consumer protection law requires otherwise.
                            </p>
                            <p>
                                Any dispute arising out of or relating to these terms or the service will be resolved in the
                                courts or dispute forums designated by Filego in its applicable legal notice, unless otherwise
                                required by law.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Changes to these terms
                            </h2>
                            <p>
                                We may update these Terms of Service from time to time. Continued use of Filego after revised
                                terms become effective means you accept the updated terms, to the extent permitted by law.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Contact
                            </h2>
                            <p>
                                For legal questions or notices regarding these terms, contact us at:
                            </p>
                            <div className="rounded-2xl border bg-muted/30 p-5">
                                <p className="font-medium">Filego</p>
                                <p>Email: legal@filego.in</p>
                                <p>Support: support@filego.in</p>
                                <p>
                                    Website:{" "}
                                    <Link href="/" className="underline underline-offset-4">
                                        filego.in
                                    </Link>
                                </p>
                            </div>
                        </section>

                        <section className="border-t pt-8">
                            <p className="text-sm text-muted-foreground">
                                This page is a product-ready website template and should be reviewed and
                                customized with your actual legal entity name, jurisdiction, billing terms,
                                refund policy, dispute process, and operational details before publishing.
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    );
}