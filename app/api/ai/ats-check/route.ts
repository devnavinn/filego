import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-provider"
import { consumeAiQuota, refundAiQuota } from "@/lib/ai/ai-quota"
import { analyzeResumeForJob } from "@/lib/ai/gemini"
import {
    ATS_FREE_FIX_COUNT,
    ATS_LIMITS,
    analyzeResumeText,
    buildChecks,
    computeScore,
    keepKeywordsInJob,
    matchKeywords,
    sanitizeJobKeywords,
    verdictFor,
    type AtsReport,
} from "@/lib/ats"
import { getUserPlan } from "@/lib/entitlements"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Sign in to check your resume with AI." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const resumeText = typeof body?.resumeText === "string" ? body.resumeText.trim() : ""
    const jobRaw = typeof body?.jobText === "string" ? body.jobText.trim() : ""
    const jobText = jobRaw.length > 0 ? jobRaw : null
    // On a re-check against the same job, score against the same keywords so the scores are comparable.
    const previousKeywords = jobText ? sanitizeJobKeywords(body?.jobKeywords) : null

    if (resumeText.length < ATS_LIMITS.resumeMinChars) {
        return NextResponse.json(
            {
                ok: false,
                error: "We could only read a few words from this resume. If it's a scanned or image PDF, an ATS can't read it either. Export it as a text-based PDF or DOCX.",
            },
            { status: 400 }
        )
    }
    if (resumeText.length > ATS_LIMITS.resumeMaxChars) {
        return NextResponse.json({ ok: false, error: "This resume is too long. Upload a resume of up to about 6 pages." }, { status: 400 })
    }
    if (jobText && (jobText.length < ATS_LIMITS.jobMinChars || jobText.length > ATS_LIMITS.jobMaxChars)) {
        return NextResponse.json(
            { ok: false, error: `Paste the full job description (${ATS_LIMITS.jobMinChars}–${ATS_LIMITS.jobMaxChars.toLocaleString()} characters).` },
            { status: 400 }
        )
    }

    const [quota, plan] = await Promise.all([consumeAiQuota(userId), getUserPlan(userId)])
    if (!quota.allowed) {
        return NextResponse.json(
            { ok: false, error: "You've reached today's AI generation limit. Upgrade for more.", quota },
            { status: 429 }
        )
    }

    try {
        const analysis = await analyzeResumeForJob({ resumeText, jobText })
        const facts = analyzeResumeText(resumeText)
        const checks = buildChecks(facts)
        const jobKeywords = jobText ? keepKeywordsInJob(jobText, previousKeywords ?? analysis.keywords) : []
        const keywords = matchKeywords(resumeText, jobKeywords)
        // If the AI found no usable keywords, score the resume without a keyword section rather than as 0%.
        const hasJobDescription = Boolean(jobText) && keywords.length > 0
        const { score, parts } = computeScore({
            keywords,
            checks,
            facts,
            experienceScore: analysis.experienceScore,
            impactScore: analysis.impactScore,
            hasJobDescription,
        })

        const isPro = plan.tier === "pro"
        const report: AtsReport = {
            score,
            verdict: verdictFor(score, hasJobDescription),
            hasJobDescription,
            jobTitle: analysis.jobTitle,
            parts,
            keywords,
            jobKeywords,
            checks,
            experienceNote: analysis.experienceNote,
            impactNote: analysis.impactNote,
            // Locked content is never sent to free accounts, only how much of it there is.
            fixes: isPro ? analysis.fixes : analysis.fixes.slice(0, ATS_FREE_FIX_COUNT),
            bulletRewrites: isPro ? analysis.bulletRewrites : [],
            tailoredSummary: isPro ? analysis.tailoredSummary : null,
            locked: isPro
                ? null
                : {
                      fixes: Math.max(0, analysis.fixes.length - ATS_FREE_FIX_COUNT),
                      bulletRewrites: analysis.bulletRewrites.length,
                      tailoredSummary: Boolean(analysis.tailoredSummary),
                  },
        }
        return NextResponse.json({ ok: true, report, quota })
    } catch (error) {
        console.error("[AI_ATS_CHECK_ERROR]", error)
        await refundAiQuota(userId)
        const message =
            error instanceof Error && error.message.startsWith("The AI is busy")
                ? error.message
                : "AI couldn't check this resume. Please try again."
        return NextResponse.json({ ok: false, error: message }, { status: 502 })
    }
}
