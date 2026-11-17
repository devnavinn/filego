// Client-safe ATS Resume Checker logic: deterministic keyword matching, resume checks, and scoring.
// The AI only extracts job keywords and judges fit/impact; the score itself is computed here so it is
// consistent between runs and explainable line by line.

export type KeywordImportance = "required" | "preferred"
export type KeywordCategory = "skill" | "tool" | "certification" | "qualification" | "soft_skill" | "domain"

export type JobKeyword = {
    term: string
    aliases: string[]
    importance: KeywordImportance
    category: KeywordCategory
}

export type KeywordResult = JobKeyword & { found: boolean }

export type CheckStatus = "pass" | "warn" | "fail"
export type ResumeCheck = { id: string; label: string; status: CheckStatus; detail: string }

export type ScorePart = { id: "keywords" | "experience" | "impact" | "format" | "sections"; label: string; score: number; weight: number }

export type FixPriority = "high" | "medium" | "low"
export type ResumeFix = { priority: FixPriority; section: string; issue: string; fix: string }
export type BulletRewrite = { original: string; improved: string }

export type AtsReport = {
    /** 0–100. */
    score: number
    verdict: string
    hasJobDescription: boolean
    jobTitle: string | null
    parts: ScorePart[]
    keywords: KeywordResult[]
    checks: ResumeCheck[]
    experienceNote: string | null
    impactNote: string | null
    fixes: ResumeFix[]
    bulletRewrites: BulletRewrite[]
    tailoredSummary: string | null
    /** The job keywords that were scored, so a re-check against the same job reuses them. */
    jobKeywords: JobKeyword[]
    /** Free accounts see the first few fixes; the rest (plus rewrites and summary) are Pro. */
    locked: { fixes: number; bulletRewrites: number; tailoredSummary: boolean } | null
}

/** Free accounts get this many fixes; Pro gets everything. */
export const ATS_FREE_FIX_COUNT = 3

export const ATS_LIMITS = {
    resumeMinChars: 200,
    resumeMaxChars: 30_000,
    jobMinChars: 80,
    jobMaxChars: 15_000,
} as const

// ---------------------------------------------------------------------------
// Keyword matching
// ---------------------------------------------------------------------------

/** Lowercases and folds punctuation variants so "Node.JS", "node js", and "NodeJS" compare equal-ish. */
export function normalizeForMatch(text: string): string {
    return ` ${text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[‐-―]/g, "-")
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, " ")} `
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Longest first. Only these endings are treated as the same word ("mentor", "mentored", "mentoring"). */
const SUFFIXES = ["ements", "ement", "ments", "ment", "ings", "ing", "ers", "er", "ed", "es", "s", "e"]
const SUFFIX_GROUP = `(?:${SUFFIXES.join("|")})?`

/**
 * Light stemmer for keyword matching: strips one common ending so variants of a word match.
 * Returns null for words that shouldn't be stemmed (short tech terms like "REST", "Java", "AWS",
 * and words ending in "ss").
 */
function stemWord(word: string): string | null {
    if (!/^[a-z]+$/.test(word) || word.endsWith("ss")) return null
    for (const suffix of SUFFIXES) {
        if (word.endsWith(suffix) && word.length - suffix.length >= 4) return word.slice(0, -suffix.length)
    }
    return word.length >= 5 ? word : null
}

/**
 * Builds a matcher for one term. Word boundaries are "not a letter/digit" so terms with symbols
 * (C++, C#, .NET, CI/CD) work; separators inside the term match space, hyphen, dot, or nothing;
 * longer words match their common variants (mentoring ↔ mentored ↔ mentor); and a simple
 * plural is allowed on the last word.
 */
function termPattern(term: string): RegExp | null {
    const cleaned = term.toLowerCase().trim().replace(/\s+/g, " ")
    if (!cleaned) return null
    const words = cleaned.split(/[\s\-.]+/).filter(Boolean)
    if (words.length === 0) return null
    const body = words
        .map((word, index) => {
            const stem = stemWord(word)
            if (stem) return escapeRegExp(stem) + SUFFIX_GROUP
            const isLast = index === words.length - 1
            return escapeRegExp(word) + (isLast && /[a-z]$/.test(word) ? "(?:e?s)?" : "")
        })
        .join("[\\s\\-.]?")
    return new RegExp(`(?<![a-z0-9])${cleaned.startsWith(".") ? "\\." : ""}${body}(?![a-z0-9+#])`, "i")
}

export function containsTerm(normalizedText: string, term: string): boolean {
    const pattern = termPattern(term)
    return pattern ? pattern.test(normalizedText) : false
}

export function matchKeywords(resumeText: string, keywords: JobKeyword[]): KeywordResult[] {
    const text = normalizeForMatch(resumeText)
    return keywords.map((keyword) => ({
        ...keyword,
        found: [keyword.term, ...keyword.aliases].some((term) => containsTerm(text, term)),
    }))
}

/** Drops keywords the AI made up: the term or an alias must actually appear in the job description. */
export function keepKeywordsInJob(jobText: string, keywords: JobKeyword[]): JobKeyword[] {
    const text = normalizeForMatch(jobText)
    const seen = new Set<string>()
    return keywords.filter((keyword) => {
        const key = keyword.term.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return [keyword.term, ...keyword.aliases].some((term) => containsTerm(text, term))
    })
}

function keywordScore(results: KeywordResult[]): number {
    if (results.length === 0) return 0
    let total = 0
    let got = 0
    for (const result of results) {
        const weight = result.importance === "required" ? 2 : 1
        total += weight
        if (result.found) got += weight
    }
    return (got / total) * 100
}

// ---------------------------------------------------------------------------
// Deterministic resume checks
// ---------------------------------------------------------------------------

const SECTION_PATTERNS: Record<string, RegExp> = {
    experience: /^\s*(work\s+)?(experience|employment(\s+history)?|work\s+history|professional\s+experience|internships?)\b/im,
    education: /^\s*(education|academic\s+(background|qualifications?)|qualifications?)\b/im,
    skills: /^\s*((technical|key|core)\s+)?(skills|competencies|technologies|tech\s+stack)\b/im,
    summary: /^\s*(professional\s+)?(summary|profile|objective|about\s+me|career\s+objective)\b/im,
    projects: /^\s*(academic\s+|personal\s+|key\s+)?projects\b/im,
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
/** A run of digits and phone separators holding 10–13 digits (Indian and international numbers, not year ranges). */
function hasPhoneNumber(text: string): boolean {
    return (text.match(/\+?\(?\d[\d\s().-]{8,18}\d/g) ?? []).some((run) => {
        const digits = run.replace(/\D/g, "").length
        return digits >= 10 && digits <= 13 && !/^\s*(19|20)\d{2}\D+(19|20)\d{2}/.test(run)
    })
}
const LINKEDIN = /linkedin\.com\/in\/[a-z0-9_-]+/i
/** Common on Indian resumes but not needed by employers, and can invite bias. */
const PERSONAL_DETAILS = /\b(date\s+of\s+birth|d\.?o\.?b\.?|marital\s+status|father'?s\s+name|mother'?s\s+name|religion|caste|nationality|gender)\b/i
/** Replacement characters and private-use glyphs (icon fonts) that ATS parsers turn into garbage. */
const GARBLED = /[�-]/g

const BULLET_MARKER = /^\s*(?:[-–—•●○◦▪▫■□➢➤►▶✓✔*·]|\d{1,2}[.)])\s+/

/**
 * Achievement lines: lines starting with a bullet marker. Some PDFs lose their bullet glyphs,
 * so if none are found, fall back to sentence-like lines that aren't contact or heading lines.
 */
function bulletLines(text: string): string[] {
    const lines = text.split("\n").map((line) => line.trim())
    const marked = lines.filter((line) => BULLET_MARKER.test(line) && line.split(/\s+/).length >= 4)
    if (marked.length >= 3) return marked.map((line) => line.replace(BULLET_MARKER, ""))
    return lines.filter(
        (line) => line.split(/\s+/).length >= 8 && !line.includes("|") && !EMAIL.test(line) && !hasPhoneNumber(line)
    )
}

function isQuantified(line: string): boolean {
    const withoutDates = line.replace(/\b(19|20)\d{2}\b/g, "").replace(/\b(cgpa|gpa|sgpa)\s*:?\s*[\d.]+/gi, "")
    return /\d/.test(withoutDates) || /%|₹|\$|\b(lakh|crore|million|billion)\b/i.test(line)
}

export type ResumeFacts = {
    wordCount: number
    sections: Record<keyof typeof SECTION_PATTERNS, boolean>
    hasEmail: boolean
    hasPhone: boolean
    hasLinkedIn: boolean
    personalDetails: string | null
    garbledChars: number
    bulletCount: number
    quantifiedBullets: number
}

export function analyzeResumeText(text: string): ResumeFacts {
    const sections = Object.fromEntries(
        Object.entries(SECTION_PATTERNS).map(([key, pattern]) => [key, pattern.test(text)])
    ) as ResumeFacts["sections"]
    const bullets = bulletLines(text)
    return {
        wordCount: text.split(/\s+/).filter(Boolean).length,
        sections,
        hasEmail: EMAIL.test(text),
        hasPhone: hasPhoneNumber(text),
        hasLinkedIn: LINKEDIN.test(text),
        personalDetails: PERSONAL_DETAILS.exec(text)?.[0] ?? null,
        garbledChars: (text.match(GARBLED) ?? []).length,
        bulletCount: bullets.length,
        quantifiedBullets: bullets.filter(isQuantified).length,
    }
}

export function buildChecks(facts: ResumeFacts): ResumeCheck[] {
    const checks: ResumeCheck[] = []
    const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail })

    add(
        "contact",
        "Contact details",
        facts.hasEmail && facts.hasPhone ? "pass" : "fail",
        facts.hasEmail && facts.hasPhone
            ? "Email and phone number found."
            : `Missing ${[!facts.hasEmail && "email", !facts.hasPhone && "phone number"].filter(Boolean).join(" and ")}. Recruiters can't contact you.`
    )
    add(
        "linkedin",
        "LinkedIn profile",
        facts.hasLinkedIn ? "pass" : "warn",
        facts.hasLinkedIn ? "LinkedIn URL found." : "Add your LinkedIn profile URL (linkedin.com/in/…)."
    )

    const hasWork = facts.sections.experience || facts.sections.projects
    add(
        "sections",
        "Standard section headings",
        hasWork && facts.sections.education && facts.sections.skills ? "pass" : "fail",
        hasWork && facts.sections.education && facts.sections.skills
            ? "Experience, Education, and Skills headings found."
            : `ATS looks for standard headings. Missing: ${[
                  !hasWork && "Experience (or Projects)",
                  !facts.sections.education && "Education",
                  !facts.sections.skills && "Skills",
              ]
                  .filter(Boolean)
                  .join(", ")}.`
    )
    add(
        "summary",
        "Profile summary",
        facts.sections.summary ? "pass" : "warn",
        facts.sections.summary ? "Summary section found." : "Add a 2–3 line summary at the top that mirrors the job title."
    )

    const words = facts.wordCount
    add(
        "length",
        "Resume length",
        words < 250 ? "fail" : words > 1200 ? "warn" : "pass",
        words < 250
            ? `Only ${words} words. Add more detail about your work, projects, and results.`
            : words > 1200
              ? `${words} words. Aim for 1–2 pages (about 400–1,000 words).`
              : `${words} words, a good length.`
    )

    const ratio = facts.bulletCount > 0 ? facts.quantifiedBullets / facts.bulletCount : 0
    add(
        "metrics",
        "Measurable results",
        facts.bulletCount === 0 ? "warn" : ratio >= 0.3 ? "pass" : ratio >= 0.1 ? "warn" : "fail",
        facts.bulletCount === 0
            ? "No bullet points found. Describe your work as bullet points with results."
            : `${facts.quantifiedBullets} of ${facts.bulletCount} bullet points include numbers. Aim for at least a third (%, ₹, users, time saved).`
    )

    add(
        "parsing",
        "Readable by ATS",
        facts.garbledChars > 5 ? "fail" : facts.garbledChars > 0 ? "warn" : "pass",
        facts.garbledChars > 0
            ? `${facts.garbledChars} unreadable characters found, usually from icons or fancy fonts. Use plain text for contact details and bullets.`
            : "Text extracted cleanly."
    )

    add(
        "personal",
        "No unnecessary personal details",
        facts.personalDetails ? "warn" : "pass",
        facts.personalDetails
            ? `Found "${facts.personalDetails}". Date of birth, marital status, and family details aren't needed and can lead to bias. Remove them.`
            : "No unnecessary personal details."
    )
    return checks
}

const CHECK_PENALTY: Record<CheckStatus, number> = { pass: 0, warn: 0.5, fail: 1 }

function checksScore(checks: ResumeCheck[], ids: string[]): number {
    const relevant = checks.filter((check) => ids.includes(check.id))
    if (relevant.length === 0) return 100
    const lost = relevant.reduce((sum, check) => sum + CHECK_PENALTY[check.status], 0)
    return Math.max(0, 100 - (lost / relevant.length) * 100)
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function verdictFor(score: number, hasJobDescription: boolean): string {
    if (score >= 80) return hasJobDescription ? "Strong match. Ready to apply." : "Strong resume."
    if (score >= 65) return hasJobDescription ? "Good match, with a few gaps to fix." : "Good resume, with a few things to fix."
    if (score >= 50) return "Needs work before you apply."
    return "Likely to be filtered out. Fix the high-priority items first."
}

export function computeScore(input: {
    keywords: KeywordResult[]
    checks: ResumeCheck[]
    facts: ResumeFacts
    experienceScore: number
    impactScore: number
    hasJobDescription: boolean
}): { score: number; parts: ScorePart[] } {
    const metricsRatio = input.facts.bulletCount > 0 ? input.facts.quantifiedBullets / input.facts.bulletCount : 0
    // Blend the AI's impact judgement with the measured share of quantified bullets.
    const impact = 0.6 * input.impactScore + 0.4 * Math.min(100, (metricsRatio / 0.4) * 100)

    const parts: ScorePart[] = [
        ...(input.hasJobDescription
            ? [{ id: "keywords" as const, label: "Keyword match", score: keywordScore(input.keywords), weight: 35 }]
            : []),
        {
            id: "experience",
            label: input.hasJobDescription ? "Experience & role fit" : "Experience",
            score: input.experienceScore,
            weight: 25,
        },
        { id: "impact", label: "Impact & achievements", score: impact, weight: 15 },
        { id: "format", label: "ATS formatting", score: checksScore(input.checks, ["parsing", "length", "personal", "metrics"]), weight: 15 },
        { id: "sections", label: "Sections & contact", score: checksScore(input.checks, ["contact", "linkedin", "sections", "summary"]), weight: 10 },
    ]
    const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0)
    const weighted = parts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight
    return {
        score: Math.round(Math.max(0, Math.min(100, weighted))),
        parts: parts.map((part) => ({ ...part, score: Math.round(part.score) })),
    }
}

/** Collapses whitespace and case so AI-quoted resume lines can be checked against the real text. */
export function looseText(value: string): string {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

/** Validates job keywords sent back by the browser for a re-check (they are untrusted input). */
export function sanitizeJobKeywords(value: unknown): JobKeyword[] | null {
    if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null
    const result: JobKeyword[] = []
    for (const item of value) {
        const term = typeof item?.term === "string" ? item.term.trim() : ""
        if (!term || term.length > 60) return null
        const aliases = Array.isArray(item.aliases)
            ? item.aliases.filter((a: unknown): a is string => typeof a === "string" && a.trim().length > 0 && a.length <= 60).slice(0, 5)
            : []
        result.push({
            term,
            aliases,
            importance: item.importance === "required" ? "required" : "preferred",
            category: ["skill", "tool", "certification", "qualification", "soft_skill", "domain"].includes(item.category) ? item.category : "skill",
        })
    }
    return result
}
