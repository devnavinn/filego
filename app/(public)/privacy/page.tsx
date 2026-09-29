import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | Filego",
    description:
        "Read Filego's Privacy Policy to understand how we handle files, analytics, advertising, cookies, and account data.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-background">
            <section className="border-b">
                <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
                    <p className="text-sm font-medium text-muted-foreground">
                        Legal
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                        Privacy Policy
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                        This Privacy Policy explains how Filego collects, uses, and protects
                        information when you use our website and file tools.
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Last updated: September 29, 2026
                    </p>
                </div>
            </section>

            <section>
                <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
                    <div className="space-y-10 text-sm leading-7 text-foreground/90 md:text-base">
                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Overview
                            </h2>
                            <p>
                                Filego provides browser-based and cloud-assisted file tools such as
                                image compression, file conversion, and PDF utilities. Depending on
                                the tool you use, file processing may happen entirely in your browser
                                or may require temporary server-side processing.
                            </p>
                            <p>
                                We aim to collect the minimum amount of information needed to run,
                                secure, and improve the service.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Information we collect
                            </h2>
                            <p>We may collect the following categories of information:</p>
                            <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                                <li>
                                    Account information, such as your name, email address, and login details,
                                    if you create an account.
                                </li>
                                <li>
                                    Billing information, such as payment status, the Pro pass you bought, its
                                    start and end dates, and transaction references. Payments are processed by
                                    Razorpay; we do not receive or store your full card, UPI, or bank details.
                                </li>
                                <li>
                                    Usage information, such as browser type, device type, pages visited,
                                    feature usage, timestamps, approximate location derived from IP, and
                                    crash/error logs.
                                </li>
                                <li>
                                    File-related information needed to operate the tool, such as filename,
                                    file type, file size, and processing metadata.
                                </li>
                                <li>
                                    Support information, such as messages, attachments, and details you share
                                    when you contact us.
                                </li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                How file processing works
                            </h2>
                            <p>
                                Some Filego tools are designed to process files locally in your browser.
                                In those cases, your files may never be uploaded to our servers and are
                                processed using browser APIs, memory, and client-side libraries.
                            </p>
                            <p>
                                Other tools may require server-side processing to generate results or enable
                                advanced functionality. When server-side processing is used, files may be
                                transmitted to our infrastructure or trusted processors only for the time
                                needed to complete the requested operation.
                            </p>
                            <p>
                                Because Filego may offer both browser-local and server-assisted workflows,
                                the exact processing method can vary by feature, file type, and device/browser support.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                How we use information
                            </h2>
                            <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                                <li>Provide, maintain, and improve Filego.</li>
                                <li>Process files and return requested outputs.</li>
                                <li>Authenticate users and manage accounts.</li>
                                <li>Process Pro pass payments and send reminders before a pass ends.</li>
                                <li>Show ads to visitors on the Free plan.</li>
                                <li>Monitor performance, detect abuse, and prevent fraud.</li>
                                <li>Respond to support requests and service inquiries.</li>
                                <li>Comply with legal obligations and enforce our terms.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Cookies and analytics
                            </h2>
                            <p>
                                We may use cookies, local storage, and similar technologies to keep you
                                signed in, remember preferences, improve performance, and understand how
                                users interact with the site.
                            </p>
                            <p>
                                We use Google Analytics, Google Tag Manager, and Vercel Web Analytics and Speed
                                Insights to understand traffic, feature adoption, and reliability. These tools may
                                collect technical information such as IP address, browser details, device data, and
                                page events. Our{" "}
                                <Link href="/cookies" className="underline underline-offset-4">
                                    Cookie Policy
                                </Link>{" "}
                                lists the cookies we use.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Advertising
                            </h2>
                            <p>
                                Filego shows ads from Google AdSense to visitors who are not signed in and to
                                users on the Free plan. Ads appear on tool, category, and blog pages, never
                                inside the tools themselves. Filego Pro users see no ads, and the AdSense code
                                is not loaded for them.
                            </p>
                            <p>
                                Google and its partners use cookies and similar identifiers to serve ads based on
                                your visits to Filego and other websites, to limit how often you see an ad, and to
                                measure ad performance. Google&apos;s use of this information is covered by its own
                                policies; see{" "}
                                <a
                                    href="https://policies.google.com/technologies/partner-sites"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-4"
                                >
                                    how Google uses information from sites that use its services
                                </a>
                                .
                            </p>
                            <p>
                                If you are in the European Economic Area, the UK, or Switzerland, we ask for your
                                consent through Google&apos;s consent message before personalized ads are shown.
                                Anywhere, you can turn off personalized ads in{" "}
                                <a
                                    href="https://myadcenter.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-4"
                                >
                                    Google My Ad Center
                                </a>{" "}
                                or opt out of personalized ads from many providers at{" "}
                                <a
                                    href="https://optout.aboutads.info/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-4"
                                >
                                    aboutads.info
                                </a>
                                .
                            </p>
                            <p>
                                We do not give your files, file contents, or account details to advertisers.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Sharing of information
                            </h2>
                            <p>We may share information with trusted third parties only when needed to operate the service, including:</p>
                            <ul className="list-disc space-y-2 pl-5 text-foreground/90">
                                <li>Hosting and infrastructure providers, such as Vercel and Neon.</li>
                                <li>Our payment processor, Razorpay.</li>
                                <li>Analytics and advertising providers, such as Google Analytics and Google AdSense.</li>
                                <li>Email providers, such as Resend, for sign-in codes, password resets, and Pro reminders.</li>
                                <li>
                                    AI providers, such as Google Gemini, which process the files or text you submit
                                    to our AI tools in order to return a result.
                                </li>
                                <li>Authorities or legal recipients when required by law.</li>
                            </ul>
                            <p>
                                We do not sell your personal information in the ordinary course of running the service.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Data retention
                            </h2>
                            <p>
                                We retain personal information only for as long as needed to provide the service,
                                comply with legal obligations, resolve disputes, and enforce agreements.
                            </p>
                            <p>
                                Retention for files and generated outputs depends on how a specific tool works.
                                Browser-local tools may not retain files on our servers at all, while server-assisted
                                tools may keep files temporarily for processing, recovery, abuse prevention, or
                                support purposes.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Security
                            </h2>
                            <p>
                                We use reasonable technical and organizational safeguards designed to protect
                                personal information and files from unauthorized access, loss, misuse, or disclosure.
                            </p>
                            <p>
                                No method of transmission or storage is completely secure, so we cannot guarantee
                                absolute security.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Your rights and choices
                            </h2>
                            <p>
                                Depending on your location, you may have rights to access, correct, delete,
                                restrict, object to, or export certain personal information.
                            </p>
                            <p>
                                You may also be able to control cookies through your browser settings and unsubscribe
                                from non-essential communications through links in those messages.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Children’s privacy
                            </h2>
                            <p>
                                Filego is not intended for children under the age required by applicable law to
                                use the service without parental consent, and we do not knowingly collect personal
                                information from children in violation of applicable law.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                International transfers
                            </h2>
                            <p>
                                If you use Filego from outside the country where our services are operated, your
                                information may be transferred to and processed in other jurisdictions where our
                                providers or infrastructure are located.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Changes to this policy
                            </h2>
                            <p>
                                We may update this Privacy Policy from time to time. When we do, we will revise the
                                “Last updated” date and, where required, provide additional notice.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Contact us
                            </h2>
                            <p>
                                If you have questions about this Privacy Policy or want to submit a privacy-related
                                request, contact us at:
                            </p>
                            <div className="rounded-2xl border bg-muted/30 p-5">
                                <p className="font-medium">Filego</p>
                                <p>Email: hello@filego.in</p>
                                <p>Support: hello@filego.in</p>
                                <p>Website: <Link href="/" className="underline underline-offset-4">filego.in</Link></p>
                            </div>
                        </section>

                        <section className="border-t pt-8">
                            <p className="text-sm text-muted-foreground">
                                This page is provided as a product-ready website template and should be reviewed
                                and customized with your actual company name, address, contact details, data flows,
                                vendors, retention periods, and legal requirements before publishing.
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    );
}