"use client"

import { useState } from "react"
import { ImageIcon, WandSparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function BackgroundRemoverTool() {
    const [file, setFile] = useState<File | null>(null)

    return (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Background Remover</h2>
            <p className="mt-2 text-muted-foreground">
                Upload an image and remove its background for product, catalog, or creative use.
            </p>

            <div className="mt-6 space-y-4">
                <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button className="rounded-full">
                    <WandSparkles className="mr-2 h-4 w-4" />
                    Remove background
                </Button>

                {file ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        Selected file: <span className="font-medium text-foreground">{file.name}</span>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                        <ImageIcon className="mb-2 h-5 w-5" />
                        Upload PNG, JPG, or WEBP image
                    </div>
                )}
            </div>
        </div>
    )
}