import { BackgroundRemoverTool } from "@/components/tools/background-remover-tool"
import { JwtDecoderTool } from "@/components/tools/jwt-decoder-tool"
import { PdfMergeTool } from "@/components/tools/pdf-merge-tool"
import { PdfSplitTool } from "@/components/tools/pdf-split-tool"

export const toolComponentMap = {
    "pdf-merge": PdfMergeTool,
    "pdf-split": PdfSplitTool,
    "background-remover": BackgroundRemoverTool,
    "jwt-decoder": JwtDecoderTool,
} as const

export type ToolComponentSlug = keyof typeof toolComponentMap