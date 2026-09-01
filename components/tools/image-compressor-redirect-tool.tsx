import Link from "next/link"
import { ArrowRight, Image as ImageIcon, Images } from "lucide-react"

export function ImageCompressorRedirectTool() {
    return (
        <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Image Compressor</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Image compression already has a dedicated, more capable workspace. Pick the workflow that fits your
                files.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                    href="/image-squoosh"
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 p-5 transition-colors hover:bg-muted/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-background p-2.5">
                            <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Single image</p>
                            <p className="text-xs text-muted-foreground">Fine-tune quality and format</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        Open compressor
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </Link>

                <Link
                    href="/bulk-image-compressor"
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 p-5 transition-colors hover:bg-muted/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-background p-2.5">
                            <Images className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Bulk compress</p>
                            <p className="text-xs text-muted-foreground">Compress many images at once</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        Open bulk compressor
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </Link>
            </div>
        </div>
    )
}
