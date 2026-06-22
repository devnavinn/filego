import { ComingSoon } from "../coming-soon"
import { toolComponentMap } from "@/lib/tool-component-map"

type ToolRendererProps = {
    toolSlug: string
    toolName: string
    categoryName?: string
    backHref?: string
}

export function ToolRenderer({
    toolSlug,
    toolName,
    categoryName,
    backHref,
}: ToolRendererProps) {
    const ToolComponent = toolComponentMap[toolSlug as keyof typeof toolComponentMap]

    if (!ToolComponent) {
        return (
            <ComingSoon
                isMobile={true}
                title={`${toolName} is coming soon.`}
                description={`We’re building ${toolName}${categoryName ? ` under ${categoryName}` : ""
                    } right now. It will launch soon with a faster workflow, a cleaner interface, and the same Filego simplicity.`}
                backHref={backHref ?? "/tools"}
                notifyPlaceholder={`Get notified when ${toolName} launches`}
            />
        )
    }

    return <ToolComponent />
}