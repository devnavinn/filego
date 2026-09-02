"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.27-2.09 3.58-5.17 3.58-8.8z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-2.98c-1.08.72-2.45 1.15-4.04 1.15-3.11 0-5.75-2.1-6.69-4.92H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.31 14.35A7.2 7.2 0 0 1 4.91 12c0-.81.14-1.6.4-2.35V6.56H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.44l4.02-3.09z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.56l4.02 3.09c.94-2.82 3.58-4.9 6.69-4.9z"
            />
        </svg>
    );
}

function GithubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
    );
}

export function OAuthButtons({ callbackUrl }: { callbackUrl?: string }) {
    const [loadingProvider, setLoadingProvider] = useState<
        "google" | "github" | null
    >(null);

    async function handleSignIn(provider: "google" | "github") {
        setLoadingProvider(provider);
        try {
            await signIn(provider, { callbackUrl: callbackUrl || "/dashboard" });
        } finally {
            setLoadingProvider(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={loadingProvider !== null}
                    onClick={() => handleSignIn("google")}
                >
                    <GoogleIcon />
                    {loadingProvider === "google" ? "Redirecting..." : "Google"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={loadingProvider !== null}
                    onClick={() => handleSignIn("github")}
                >
                    <GithubIcon />
                    {loadingProvider === "github" ? "Redirecting..." : "GitHub"}
                </Button>
            </div>

            <FieldSeparator>Or continue with email</FieldSeparator>
        </div>
    );
}
