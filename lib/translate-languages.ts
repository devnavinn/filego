// Client-safe list of languages the AI Document Translator supports.

export type TranslateLanguage = { code: string; label: string; rtl?: boolean }

export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi (हिन्दी)" },
    { code: "bn", label: "Bengali (বাংলা)" },
    { code: "ta", label: "Tamil (தமிழ்)" },
    { code: "te", label: "Telugu (తెలుగు)" },
    { code: "mr", label: "Marathi (मराठी)" },
    { code: "gu", label: "Gujarati (ગુજરાતી)" },
    { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
    { code: "ml", label: "Malayalam (മലയാളം)" },
    { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
    { code: "or", label: "Odia (ଓଡ଼ିଆ)" },
    { code: "ur", label: "Urdu (اردو)", rtl: true },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "it", label: "Italian" },
    { code: "pt", label: "Portuguese" },
    { code: "nl", label: "Dutch" },
    { code: "ru", label: "Russian" },
    { code: "uk", label: "Ukrainian" },
    { code: "pl", label: "Polish" },
    { code: "tr", label: "Turkish" },
    { code: "ar", label: "Arabic (العربية)", rtl: true },
    { code: "fa", label: "Persian (فارسی)", rtl: true },
    { code: "he", label: "Hebrew (עברית)", rtl: true },
    { code: "zh-CN", label: "Chinese (Simplified)" },
    { code: "zh-TW", label: "Chinese (Traditional)" },
    { code: "ja", label: "Japanese" },
    { code: "ko", label: "Korean" },
    { code: "id", label: "Indonesian" },
    { code: "ms", label: "Malay" },
    { code: "th", label: "Thai" },
    { code: "vi", label: "Vietnamese" },
    { code: "ne", label: "Nepali" },
    { code: "si", label: "Sinhala" },
    { code: "sw", label: "Swahili" },
]

export const AUTO_DETECT = "auto"

export function findTranslateLanguage(code: string): TranslateLanguage | undefined {
    return TRANSLATE_LANGUAGES.find((lang) => lang.code === code)
}

/** Max characters translated per request: free accounts vs Pro. */
export const TRANSLATE_CHAR_LIMITS = { free: 20_000, pro: 60_000 } as const
