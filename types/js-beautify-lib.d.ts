declare module "js-beautify/js/lib/beautify" {
    export function js_beautify(source: string, options?: Record<string, unknown>): string
}

declare module "js-beautify/js/lib/beautify-css" {
    export function css_beautify(source: string, options?: Record<string, unknown>): string
}

declare module "js-beautify/js/lib/beautify-html" {
    export function html_beautify(source: string, options?: Record<string, unknown>): string
}
